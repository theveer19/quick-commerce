import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';
import { phoneFromRequest } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The app calls this once it has permission to show notifications, and again
// about once a day, so we know which phones still have the app.
export async function POST(req) {
  if (!rateLimit(req, { key: 'push-register', limit: 20, windowMs: 60000 }))
    return NextResponse.json({ ok: false }, { status: 429 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const token = String(body?.token || '').trim();
  if (!/^Expo(nent)?PushToken\[[A-Za-z0-9_\-]{10,120}\]$/.test(token))
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 400 });
  const platform = body?.platform === 'ios' ? 'ios' : 'android';

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, stored: false });

  const row = { token, platform, active: true, last_seen: new Date().toISOString() };
  const phone = phoneFromRequest(req);           // only a VERIFIED phone, never one from the body
  if (phone) row.phone = phone;

  const { error } = await admin.from('push_tokens').upsert(row, { onConflict: 'token' });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
