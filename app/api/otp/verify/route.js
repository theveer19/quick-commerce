import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verifies an OTP via MSG91.
export async function POST(req) {
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const phone = (body?.phone || '').trim();
  const otp = String(body?.otp || '').trim();
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) return NextResponse.json({ configured: false });
  if (!/^[6-9]\d{9}$/.test(phone) || otp.length < 4) return NextResponse.json({ verified: false, message: 'Invalid OTP' });

  try {
    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${encodeURIComponent(otp)}`;
    const r = await fetch(url, { headers: { authkey: key } });
    const j = await r.json().catch(() => ({}));
    if (j.type === 'success') return NextResponse.json({ verified: true });
    return NextResponse.json({ verified: false, message: j.message || 'Invalid or expired OTP' });
  } catch {
    return NextResponse.json({ verified: false, message: 'Verification failed' });
  }
}