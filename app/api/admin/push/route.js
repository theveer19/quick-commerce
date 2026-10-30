import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';
const DAILY_LIMIT = 5;   // protects customers from accidental spam (and uninstalls)
const LINKS = ['/', '/products', '/products?category=women', '/products?category=men',
  '/products?category=unisex', '/products?category=ethnic', '/wishlist', '/orders'];

async function requireAdmin(req, admin) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: prof } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return prof?.role === 'admin' ? data.user : null;
}

// GET → how many phones we can reach + recent sends (for the admin page)
export async function GET(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  if (!(await requireAdmin(req, admin))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count, error } = await admin.from('push_tokens').select('token', { count: 'exact', head: true }).eq('active', true);
  if (error) return NextResponse.json({ reachable: 0, campaigns: [], setup: 'Run supabase/2026-10-push-notifications.sql first.' });
  const { data: campaigns } = await admin.from('push_campaigns')
    .select('id,title,body,url,sent,failed,created_at').order('created_at', { ascending: false }).limit(15);
  return NextResponse.json({ reachable: count || 0, campaigns: campaigns || [] });
}

// POST { title, body, url } → send to every phone with the app
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  const user = await requireAdmin(req, admin);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let b; try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const title = String(b?.title || '').trim().slice(0, 65);
  const body = String(b?.body || '').trim().slice(0, 178);
  const url = LINKS.includes(b?.url) ? b.url : '/';
  if (title.length < 3 || body.length < 3) return NextResponse.json({ error: 'Write a title and a message' }, { status: 400 });

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: today } = await admin.from('push_campaigns').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if ((today || 0) >= DAILY_LIMIT)
    return NextResponse.json({ error: `Already sent ${DAILY_LIMIT} notifications in the last 24 hours. Too many make people uninstall — try tomorrow.` }, { status: 429 });

  const { data: rows, error } = await admin.from('push_tokens').select('token').eq('active', true).limit(20000);
  if (error) return NextResponse.json({ error: 'Push table missing — run supabase/2026-10-push-notifications.sql' }, { status: 500 });
  const tokens = (rows || []).map((r) => r.token);
  if (!tokens.length) return NextResponse.json({ error: 'No phones registered yet. They appear after people open the new app version and allow notifications.' }, { status: 400 });

  const headers = {
    Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json',
    ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
  };

  let sent = 0, failed = 0;
  const dead = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const messages = batch.map((to) => ({
      to, title, body, sound: 'default', priority: 'high', channelId: 'offers', data: { url },
    }));
    try {
      const r = await fetch(EXPO_URL, { method: 'POST', headers, body: JSON.stringify(messages) });
      const j = await r.json().catch(() => ({}));
      const tickets = Array.isArray(j.data) ? j.data : [];
      tickets.forEach((t, k) => {
        if (t?.status === 'ok') sent += 1;
        else {
          failed += 1;
          if (t?.details?.error === 'DeviceNotRegistered') dead.push(batch[k]);
        }
      });
      if (!tickets.length) failed += batch.length;
    } catch { failed += batch.length; }
  }

  // Phones that uninstalled the app stop being counted.
  if (dead.length) await admin.from('push_tokens').update({ active: false }).in('token', dead);
  await admin.from('push_campaigns').insert({ title, body, url, sent, failed, sent_by: user.id });

  return NextResponse.json({ ok: true, sent, failed, removed: dead.length });
}
