import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { notifyOrderStatus, withTimeout } from '@/lib/push-server';
import { sendMail, deliveredEmail, EMAIL_RE } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin updates order status / delivery partner / customer details via
// service-role (bypasses RLS), after verifying the caller is an admin.
const PHONE = /^[6-9]\d{9}$/;
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const authz = req.headers.get('authorization') || '';
  const token = authz.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — not an admin' }, { status: 403 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const { code, status, partner, customer } = body || {};
  if (!code) return NextResponse.json({ error: 'Missing order code' }, { status: 400 });

  const ALLOWED = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (status !== undefined && !ALLOWED.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  if (partner !== undefined && partner !== null && (typeof partner !== 'object' || JSON.stringify(partner).length > 500))
    return NextResponse.json({ error: 'Invalid delivery partner' }, { status: 400 });

  const patch = {};
  if (typeof status === 'string') {
    patch.status = status;
    if (status === 'delivered') patch.delivered_at = new Date().toISOString();
  }
  if (partner !== undefined) patch.delivery_partner = partner;

  // Fixing a name or number the customer mistyped at checkout. Only the fields
  // sent are touched, and they are merged into the stored object rather than
  // replacing it — otherwise correcting a name would wipe the phone number the
  // rider needs.
  if (customer && typeof customer === 'object') {
    const next = {};
    if (customer.name !== undefined) {
      const name = String(customer.name).trim();
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json({ error: 'Enter a valid name' }, { status: 400 });
      }
      next.name = name;
    }
    if (customer.phone !== undefined) {
      const phone = String(customer.phone).replace(/\D/g, '');
      if (!PHONE.test(phone)) {
        return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
      }
      next.phone = phone;
    }
    if (customer.email !== undefined) {
      const email = String(customer.email || '').trim().toLowerCase();
      if (email && !EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
      }
      next.email = email || null;
    }
    if (Object.keys(next).length) {
      const { data: row } = await admin.from('orders').select('customer').eq('code', code).maybeSingle();
      if (!row) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      patch.customer = { ...(row.customer || {}), ...next };
    }
  }

  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  // Remember the old status so the customer is only notified on a real change.
  const { data: before } = await admin.from('orders').select('status').eq('code', String(code).slice(0, 40)).maybeSingle();

  const { data, error } = await admin.from('orders').update(patch).eq('code', String(code).slice(0, 40)).select().maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update order' }, { status: 500 });

  // Cancelled by the shop → put the pieces back on the shelf (once).
  if (data && status === 'cancelled' && before?.status && before.status !== 'cancelled') {
    for (const it of data.items || []) {
      const qty = Math.max(0, Math.floor(Number(it.qty) || 0));
      if (it.id && qty) { try { await admin.rpc('increment_stock', { p_id: it.id, p_qty: qty }); } catch {} }
    }
  }

  if (data && typeof status === 'string' && before?.status !== status) {
    // App push for every step; the "thank you" email only once, on delivery,
    // and only if the customer gave an email at checkout.
    const mail = status === 'delivered' && data.customer?.email ? deliveredEmail(data) : null;
    await Promise.allSettled([
      withTimeout(notifyOrderStatus(admin, data, status), 5000),
      mail ? withTimeout(sendMail({ to: data.customer.email, ...mail, tag: 'delivered-email' }), 6000) : null,
    ]);
  }
  return NextResponse.json(data || { ok: true });
}