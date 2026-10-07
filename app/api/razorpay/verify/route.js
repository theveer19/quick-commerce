import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a, b) {
  const ba = Buffer.from(a || '', 'utf8');
  const bb = Buffer.from(b || '', 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function POST(req) {
  if (!rateLimit(req, { key: 'verify', limit: 20, windowMs: 60000 }))
    return NextResponse.json({ verified: false, error: 'Too many attempts' }, { status: 429 });

  const secret = process.env.RAZORPAY_KEY_SECRET;

  // Fail closed. This used to return { verified: true } when the secret was
  // missing, which meant a dropped env var would have accepted any payment
  // response — including a forged one — without checking a thing.
  if (!secret) {
    console.error('[razorpay/verify] RAZORPAY_KEY_SECRET is not set — refusing to verify');
    return NextResponse.json(
      { verified: false, error: 'Payments are not configured. Please contact support.' },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, code } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return NextResponse.json({ verified: false, error: 'Missing fields' }, { status: 400 });

  const expected = crypto.createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (!safeEqual(expected, razorpay_signature)) {
    console.error('[razorpay/verify] signature mismatch', { razorpay_order_id, code });
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  // Mark the order paid server-side (source of truth). The signature is valid,
  // so the money is real even if this write fails — say so rather than
  // swallowing the error, and let the webhook and reconcile catch the rest.
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('[razorpay/verify] no service role key — paid order not recorded', { razorpay_order_id });
    return NextResponse.json({ verified: true, recorded: false });
  }

  const patch = { payment_status: 'paid', payment_id: razorpay_payment_id };
  const { data, error } = await admin.from('orders')
    .update(patch)
    .eq('razorpay_order_id', razorpay_order_id)
    .select('code,status')
    .maybeSingle();

  if (error || !data) {
    console.error('[razorpay/verify] could not record payment', {
      razorpay_order_id, code, error: error?.message,
    });
    return NextResponse.json({ verified: true, recorded: false });
  }

  // Only move an order forward. A reconcile or a late webhook must never pull a
  // packed or delivered order back to "confirmed".
  if (data.status === 'placed') {
    await admin.from('orders').update({ status: 'confirmed' }).eq('code', data.code);
  }

  return NextResponse.json({ verified: true, recorded: true });
}
