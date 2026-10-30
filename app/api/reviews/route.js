import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';
import { phoneFromRequest } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
const CODE = /^ONET-[0-9]{8}-[A-Z0-9]{4,8}$/i;

// "Aman Shivhare" → "Aman S." — enough to feel real, not enough to identify.
function shortName(n) {
  const parts = String(n || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'OneT customer';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

/**
 * GET ?product=<id>  → public reviews + summary for a product
 * GET ?order=<code>  → which items of MY delivered order I already rated (needs session)
 */
export async function GET(req) {
  if (!rateLimit(req, { key: 'reviews-get', limit: 60, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const product = url.searchParams.get('product') || '';
  const order = url.searchParams.get('order') || '';
  if (!admin) return NextResponse.json({ count: 0, avg: null, dist: {}, reviews: [] });

  if (order) {
    const phone = phoneFromRequest(req);
    if (!phone || !CODE.test(order)) return NextResponse.json({ reviews: [] });
    const { data } = await admin.from('reviews').select('product_id,rating,comment').eq('order_code', order).eq('phone', phone);
    return NextResponse.json({ reviews: data || [] });
  }

  if (!UUID.test(product)) return NextResponse.json({ count: 0, avg: null, dist: {}, reviews: [] });
  const { data, error } = await admin
    .from('reviews')
    .select('name,rating,comment,created_at')
    .eq('product_id', product).eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ count: 0, avg: null, dist: {}, reviews: [] });
  const rows = data || [];
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rows.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  const avg = rows.length ? Math.round((rows.reduce((a, r) => a + r.rating, 0) / rows.length) * 10) / 10 : null;
  return NextResponse.json({
    count: rows.length, avg, dist,
    reviews: rows.slice(0, 30).map((r) => ({ name: shortName(r.name), rating: r.rating, comment: r.comment || '', created_at: r.created_at })),
  }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } });
}

/** POST { code, reviews: [{ product_id, rating, comment }] } — only for my DELIVERED order. */
export async function POST(req) {
  if (!rateLimit(req, { key: 'reviews-post', limit: 10, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Reviews are not available right now' }, { status: 503 });

  const phone = phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'Please log in to write a review' }, { status: 401 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const code = String(body?.code || '').slice(0, 40);
  const list = Array.isArray(body?.reviews) ? body.reviews.slice(0, 20) : [];
  if (!CODE.test(code) || !list.length) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { data: order } = await admin.from('orders').select('code,status,customer,items').eq('code', code).maybeSingle();
  const owner = String(order?.customer?.phone || '').replace(/\D/g, '').slice(-10);
  if (!order || owner !== phone) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'delivered') return NextResponse.json({ error: 'You can review once your order is delivered' }, { status: 400 });

  const inOrder = new Set((order.items || []).map((i) => String(i.id)));
  const now = new Date().toISOString();
  const rows = [];
  for (const r of list) {
    const pid = String(r?.product_id || '');
    const rating = Math.round(Number(r?.rating));
    if (!inOrder.has(pid) || !UUID.test(pid) || !(rating >= 1 && rating <= 5)) continue;
    const comment = String(r?.comment || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500) || null;
    rows.push({ product_id: pid, order_code: code, phone, name: String(order.customer?.name || '').slice(0, 60), rating, comment, updated_at: now });
  }
  if (!rows.length) return NextResponse.json({ error: 'Pick a star rating first' }, { status: 400 });

  const { error } = await admin.from('reviews').upsert(rows, { onConflict: 'order_code,product_id' });
  if (error) {
    console.error('[reviews] save failed', error.message);
    return NextResponse.json({ error: 'Could not save your review. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}
