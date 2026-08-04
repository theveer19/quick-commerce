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
  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, code } = body;

  // demo mode (no secret): accept so the flow completes end-to-end
  if (!secret) return NextResponse.json({ verified: true, demo: true });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return NextResponse.json({ verified: false, error: 'Missing fields' }, { status: 400 });

  const expected = crypto.createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (!safeEqual(expected, razorpay_signature))
    return NextResponse.json({ verified: false }, { status: 400 });

  // mark the order paid server-side (source of truth)
  const admin = getSupabaseAdmin();
  if (admin) {
    let upd = admin.from('orders')
      .update({ payment_status: 'paid', payment_id: razorpay_payment_id, status: 'confirmed' });
    upd = razorpay_order_id ? upd.eq('razorpay_order_id', razorpay_order_id) : upd.eq('code', code);
    try { await upd; } catch {}
  }
  return NextResponse.json({ verified: true });
}
