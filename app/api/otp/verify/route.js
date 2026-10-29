import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
import { signSession } from '@/lib/session';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verifies an OTP via MSG91 and, on success, returns a signed session token
// that proves the caller owns this phone number (see lib/session.js).
export async function POST(req) {
  if (!rateLimit(req, { key: 'otp-verify-ip', limit: 15, windowMs: 10 * 60000 }))
    return NextResponse.json({ verified: false, message: 'Too many attempts. Please wait a few minutes.' }, { status: 429 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const phone = (body?.phone || '').trim();
  const otp = String(body?.otp || '').trim();
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) return NextResponse.json({ configured: false });
  if (!/^[6-9]\d{9}$/.test(phone) || !/^\d{4,6}$/.test(otp)) return NextResponse.json({ verified: false, message: 'Invalid OTP' });

  // A 6-digit code must not be guessable: 6 wrong tries per number per 10 min.
  if (!rateLimit(req, { key: 'otp-verify-phone', id: phone, limit: 6, windowMs: 10 * 60000 }))
    return NextResponse.json({ verified: false, message: 'Too many wrong attempts. Request a new OTP in 10 minutes.' }, { status: 429 });

  try {
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${encodeURIComponent(otp)}`;
    const r = await fetch(url, { headers: { authkey: key } });
    const j = await r.json().catch(() => ({}));
    if (j.type === 'success') return NextResponse.json({ verified: true, token: signSession(phone) });
    return NextResponse.json({ verified: false, message: 'Invalid or expired OTP' });
  } catch {
    return NextResponse.json({ verified: false, message: 'Verification failed' });
  }
}
