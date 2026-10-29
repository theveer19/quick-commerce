import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' };

// What the hosted pay page needs to open Razorpay for an order the APP placed.
// Amount and Razorpay order id come from the database (set server-side when
// the order was created), so nothing here can be tampered with by the client.
export async function GET(req, { params }) {
  if (!rateLimit(req, { key: 'pay-info', limit: 30, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: NO_STORE });
  const code = String(params.code || '').slice(0, 40);
  if (!/^ONET-[0-9]{8}-[A-Z0-9]{4,8}$/i.test(code))
    return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Payments are not set up' }, { status: 503, headers: NO_STORE });
  const { data: o } = await admin.from('orders')
    .select('code,total,payment_method,payment_status,razorpay_order_id,status')
    .eq('code', code).maybeSingle();
  if (!o) return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_STORE });
  if (o.payment_status === 'paid') return NextResponse.json({ code, paid: true }, { headers: NO_STORE });
  if (o.status === 'cancelled') return NextResponse.json({ error: 'This order was cancelled' }, { status: 410, headers: NO_STORE });
  if (o.payment_method !== 'razorpay' || !o.razorpay_order_id)
    return NextResponse.json({ error: 'This order is pay-on-delivery' }, { status: 400, headers: NO_STORE });

  return NextResponse.json({
    code,
    paid: false,
    amount: Math.round(Number(o.total) * 100),
    orderId: o.razorpay_order_id,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  }, { headers: NO_STORE });
}
