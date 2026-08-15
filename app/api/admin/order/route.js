import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin updates order status / delivery partner via service-role (bypasses RLS),
// after verifying the caller is an admin.
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const authz = req.headers.get('authorization') || '';
  const token = authz.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — not an admin' }, { status: 403 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const { code, status, partner } = body || {};
  if (!code) return NextResponse.json({ error: 'Missing order code' }, { status: 400 });

  const patch = {};
  if (typeof status === 'string') patch.status = status;
  if (partner !== undefined) patch.delivery_partner = partner;
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await admin.from('orders').update(patch).eq('code', code).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || { ok: true });
}