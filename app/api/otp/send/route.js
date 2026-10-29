import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Sends a real OTP via MSG91. If keys aren't set, tells the client to use demo fallback.
export async function POST(req) {
  // Every SMS costs money and can be used to spam a number — limit per IP and per number.
  if (!rateLimit(req, { key: 'otp-send-ip', limit: 5, windowMs: 10 * 60000 }))
    return NextResponse.json({ error: 'Too many OTP requests. Please wait a few minutes.' }, { status: 429 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const phone = (body?.phone || '').trim();
  if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid 10-digit number' }, { status: 400 });
  if (!rateLimit(req, { key: 'otp-send-phone', id: phone, limit: 4, windowMs: 10 * 60000 }))
    return NextResponse.json({ error: 'Too many OTP requests for this number. Try again in 10 minutes.' }, { status: 429 });

  const key = process.env.MSG91_AUTH_KEY;
  const tpl = process.env.MSG91_TEMPLATE_ID;
  if (!key || !tpl) return NextResponse.json({ configured: false });

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(tpl)}&mobile=91${phone}&otp_length=6&otp_expiry=10`;
    const r = await fetch(url, { method: 'POST', headers: { authkey: key, 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (j.type === 'success' || j.request_id) return NextResponse.json({ sent: true });
    return NextResponse.json({ error: 'Could not send OTP. Please try again.' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'Could not send OTP' }, { status: 502 });
  }
}
