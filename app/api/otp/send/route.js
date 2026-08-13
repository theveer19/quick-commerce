import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Sends a real OTP via MSG91. If keys aren't set, tells the client to use demo fallback.
export async function POST(req) {
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const phone = (body?.phone || '').trim();
  if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: 'Enter a valid 10-digit number' }, { status: 400 });

  const key = process.env.MSG91_AUTH_KEY;
  const tpl = process.env.MSG91_TEMPLATE_ID;
  if (!key || !tpl) return NextResponse.json({ configured: false });

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${tpl}&mobile=91${phone}&otp_length=6&otp_expiry=10`;
    const r = await fetch(url, { method: 'POST', headers: { authkey: key, 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (j.type === 'success' || j.request_id) return NextResponse.json({ sent: true });
    return NextResponse.json({ error: j.message || 'Could not send OTP' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Could not send OTP' }, { status: 500 });
  }
}