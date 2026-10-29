import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { phoneFromRequest } from '@/lib/session';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' };

// Returns the orders of the customer who is logged in. The phone number comes
// ONLY from the signed session token issued at OTP login — a phone number in
// the request body is ignored, so nobody can read another customer's orders.
export async function POST(req) {
  if (!rateLimit(req, { key: 'my-orders', limit: 30, windowMs: 60000 }))
    return NextResponse.json({ orders: [] }, { status: 429, headers: NO_STORE });

  const phone = phoneFromRequest(req);
  if (!phone) return NextResponse.json({ orders: [], error: 'login_required' }, { status: 401, headers: NO_STORE });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ orders: [] }, { headers: NO_STORE });
  const { data, error } = await admin
    .from('orders')
    .select('code,status,items,subtotal,delivery,discount,total,payment_method,payment_status,address,customer,delivery_partner,created_at,delivered_at')
    .filter('customer->>phone', 'eq', phone)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    // older tables may lack some optional columns — fall back to *
    const retry = await admin.from('orders').select('*').filter('customer->>phone', 'eq', phone)
      .order('created_at', { ascending: false }).limit(50);
    if (retry.error) return NextResponse.json({ orders: [] }, { headers: NO_STORE });
    return NextResponse.json({ orders: (retry.data || []).map(strip) }, { headers: NO_STORE });
  }
  return NextResponse.json({ orders: (data || []).map(strip) }, { headers: NO_STORE });
}

function strip(o) {
  const { user_id, payment_id, razorpay_order_id, ...rest } = o || {};
  return rest;
}
