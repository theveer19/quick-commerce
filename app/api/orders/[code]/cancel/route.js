import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';
import { phoneFromRequest } from '@/lib/session';
import { notifyOrderStatus, withTimeout } from '@/lib/push-server';
import { sendMail, esc } from '@/lib/mailer';
import { SITE_URL } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The customer can cancel until the order is packed. After that it is already
// on its way — they can simply return it at the door (Try & Buy).
const CANCELLABLE = ['placed', 'confirmed'];
const REASONS = ['Ordered by mistake', 'Found a better price', 'Delivery taking too long', 'Want to change size or item', 'Other'];

export async function POST(req, { params }) {
  if (!rateLimit(req, { key: 'cancel', limit: 6, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Not available right now' }, { status: 503 });

  const phone = phoneFromRequest(req);
  if (!phone) return NextResponse.json({ error: 'Please log in to cancel this order' }, { status: 401 });

  const code = String(params.code || '').slice(0, 40);
  if (!/^ONET-[0-9]{8}-[A-Z0-9]{4,8}$/i.test(code)) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  let body = {}; try { body = await req.json(); } catch {}
  const reason = REASONS.includes(body?.reason) ? body.reason : 'Other';
  const note = String(body?.note || '').replace(/\s+/g, ' ').trim().slice(0, 200);

  const { data: order } = await admin.from('orders').select('*').eq('code', code).maybeSingle();
  const owner = String(order?.customer?.phone || '').replace(/\D/g, '').slice(-10);
  if (!order || owner !== phone) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status === 'cancelled') return NextResponse.json({ ok: true, status: 'cancelled' });
  if (!CANCELLABLE.includes(order.status)) {
    return NextResponse.json({ error: 'This order is already packed or on its way, so it can’t be cancelled here. You can simply return it at your door, or call us.' }, { status: 409 });
  }
  // Money already taken online needs a refund from our side — keep that with a human.
  if (order.payment_method === 'razorpay' && String(order.payment_status || '').startsWith('paid')) {
    return NextResponse.json({ error: 'This order is prepaid. Please call or WhatsApp us to cancel — we’ll refund you the same day.', needsSupport: true }, { status: 409 });
  }

  // Only flips if it is STILL cancellable (the shop might be packing it right now).
  const { data: updated, error } = await admin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('code', code)
    .in('status', CANCELLABLE)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not cancel. Please try again.' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'The shop just started packing this order. Please call us if you still want to cancel.' }, { status: 409 });

  // Put the pieces back on the shelf.
  for (const it of order.items || []) {
    const qty = Math.max(0, Math.floor(Number(it.qty) || 0));
    if (it.id && qty) { try { await admin.rpc('increment_stock', { p_id: it.id, p_qty: qty }); } catch {} }
  }

  const ownerMail = sendMail({
    to: process.env.ORDER_NOTIFY_EMAIL || 'onetvision01@gmail.com',
    subject: `❌ Order ${code} cancelled by customer`,
    html: `<h2>Order ${esc(code)} was cancelled by the customer</h2>
      <p><b>Customer:</b> ${esc(order.customer?.name)} (${esc(order.customer?.phone)})</p>
      <p><b>Reason:</b> ${esc(reason)}${note ? ` — ${esc(note)}` : ''}</p>
      <p><b>Total:</b> ₹${Number(order.total) || 0}</p>
      <p>Stock for its items has been added back.</p>
      <p><a href="${SITE_URL}/admin/orders">Open orders →</a></p>`,
    tag: 'cancel-email',
  });
  await Promise.allSettled([
    withTimeout(ownerMail, 6000),
    withTimeout(notifyOrderStatus(admin, updated, 'cancelled'), 5000),
  ]);

  return NextResponse.json({ ok: true, status: 'cancelled' });
}
