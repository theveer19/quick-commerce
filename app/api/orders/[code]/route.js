import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';
import { phoneFromRequest } from '@/lib/session';

// Live order tracking — must NEVER be cached, or the customer sees a stale
// snapshot (status/partner frozen at creation time). force-dynamic keeps the
// route dynamic; force-no-store stops Next from caching the underlying Supabase
// fetch in its Data Cache; revalidate=0 and no-store headers cover the CDN.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate' };

// Anyone holding an order code can track it (that is how the share/track link
// works), so this route only returns what tracking needs. Exact GPS pin,
// payment ids and internal ids never leave the server, and the phone number is
// masked unless the caller is the logged-in owner of the order.
export async function GET(req, { params }) {
  if (!rateLimit(req, { key: 'track', limit: 40, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: NO_STORE });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const code = String(params.code || '').slice(0, 40);
  if (!/^ONET-[0-9]{8}-[A-Z0-9]{4,8}$/i.test(code))
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });

  const { data, error } = await admin
    .from('orders')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });

  const owner = phoneFromRequest(req);
  const phone = String(data.customer?.phone || '');
  const isOwner = owner && owner === phone.replace(/\D/g, '').slice(-10);

  const { user_id, payment_id, razorpay_order_id, address = {}, customer = {}, ...rest } = data;
  const { lat, lng, ...addr } = address || {};
  return NextResponse.json({
    ...rest,
    address: addr,
    is_owner: Boolean(isOwner),
    customer: {
      name: customer?.name || '',
      phone: isOwner ? phone : (phone ? `••••••${phone.slice(-4)}` : ''),
    },
  }, { headers: NO_STORE });
}
