import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';

// What the hosted pay page needs to open Razorpay for an order, and nothing
// more. /api/orders/[code] returns the whole row — name, phone, address — which
// has no business being readable from a payment screen, so this route returns
// only the amount, the Razorpay order id and the publishable key.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate' };

export async function GET(req, { params }) {
  if (!rateLimit(req, { key: 'rzp-session', limit: 30, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429, headers: NO_STORE });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });

  const code = String(params.code || '').slice(0, 40);
  const { data, error } = await admin
    .from('orders')
    .select('code,total,payment_method,payment_status,razorpay_order_id')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
  const paid = data.payment_status === 'paid';

  return NextResponse.json({
    code: data.code,
    total: data.total,
    amount: Math.round(Number(data.total) * 100),
    prepaid: data.payment_method === 'razorpay',
    paid,
    // Nothing to open a checkout with once it is paid, so the ids are withheld.
    razorpay_order_id: paid ? null : data.razorpay_order_id,
    key_id: paid ? null : keyId,
  }, { headers: NO_STORE });
}
