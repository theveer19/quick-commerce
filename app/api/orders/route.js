import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { priceOrder } from '@/lib/pricing';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';
import { notifyOrderStatus, withTimeout } from '@/lib/push-server';
import { EMAIL_RE, sendMail, esc as escHtml } from '@/lib/mailer';
import { isServiceablePin, NOT_SERVICEABLE_MSG, SITE_URL } from '@/lib/config';

// Order email to the store owner (via Resend).
// Set RESEND_API_KEY + ORDER_NOTIFY_EMAIL in env to enable. No-op if unset.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function notifyOrderEmail(order) {
  try {
    const key = process.env.RESEND_API_KEY;
    const to = process.env.ORDER_NOTIFY_EMAIL || 'onetvision01@gmail.com';
    if (!key) { console.error('[order-email] RESEND_API_KEY is not set — owner email skipped'); return; }
    const itemsHtml = (order.items || []).map((i) => `<li>${esc(i.name || 'Item')}${i.size ? ' · ' + esc(i.size) : ''}${i.color ? ' · ' + esc(i.color) : ''} × ${Number(i.qty)} — ₹${Number(i.price) * Number(i.qty)}</li>`).join('');
    const a = order.address || {};
    const html = `
      <h2>New order ${order.code}</h2>
      <p><b>Customer:</b> ${esc(order.customer?.name)} (${esc(order.customer?.phone)})${order.customer?.email ? ' · ' + esc(order.customer.email) : ''}</p>
      <p><b>Address:</b> ${esc(a.line)}${a.landmark ? ', ' + esc(a.landmark) : ''}, ${esc(a.city)} - ${esc(a.pincode)}${a.notes ? '<br>Note: ' + esc(a.notes) : ''}</p>
      <p><b>Payment:</b> ${order.payment_method === 'razorpay' ? (order.payment_status === 'paid' ? 'Prepaid (Paid)' : 'Prepaid — PAYMENT PENDING (confirm on Razorpay before dispatch)') : 'Try & Buy (pay at door)'}</p>
      <p><b>Total: ₹${order.total}</b></p>
      <ul>${itemsHtml}</ul>
      <p>Placed at ${new Date(order.created_at).toLocaleString('en-IN')}</p>`;
    const from = process.env.ORDER_EMAIL_FROM || 'OneT India <onboarding@resend.dev>';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject: `🛍️ New order ${order.code} — ₹${order.total}`, html }),
    });
    // Resend says WHY it refused (bad key, sandbox sender, unverified domain) —
    // put that in the Vercel logs instead of swallowing it.
    if (!r.ok) console.error('[order-email] Resend refused', r.status, await r.text().catch(() => ''));
  } catch (e) { console.error('[order-email] failed', e?.message); /* never block the order */ }
}

// Customers never see stock counts, so the owner gets an email the moment an
// order leaves a product at LOW_STOCK pieces or fewer.
const LOW_STOCK = Number(process.env.LOW_STOCK_ALERT || 2);
async function lowStockAlert(admin, lines) {
  try {
    const ids = [...new Set(lines.map((l) => l.id))];
    if (!ids.length) return;
    const { data } = await admin.from('products').select('id,name,stock').in('id', ids).lte('stock', LOW_STOCK);
    if (!data?.length) return;
    const rows = data.map((p) => `<li><b>${escHtml(p.name)}</b> — ${Number(p.stock) <= 0 ? '<span style="color:#DC2626">OUT OF STOCK</span>' : `only ${Number(p.stock)} left`}</li>`).join('');
    await sendMail({
      to: process.env.ORDER_NOTIFY_EMAIL || 'onetvision01@gmail.com',
      subject: `⚠️ Low stock: ${data.map((p) => p.name).slice(0, 2).join(', ')}${data.length > 2 ? ` +${data.length - 2} more` : ''}`,
      html: `<h2>Restock soon</h2><ul>${rows}</ul><p><a href="${SITE_URL}/admin/inventory">Open inventory →</a></p>`,
      tag: 'low-stock',
    });
  } catch (e) { console.error('[low-stock] failed', e?.message); }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHONE = /^[6-9]\d{9}$/;
const PIN = /^\d{6}$/;

function makeCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  return `ONET-${y}${m}${day}-${r}`;
}

export async function POST(req) {
  if (!rateLimit(req, { key: 'orders', limit: 8, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const { items, customer, address, payment_method, coupon } = body || {};

  // ── server-side validation ──
  const name = (customer?.name || '').trim();
  const phone = (customer?.phone || '').trim();
  const line = (address?.line || '').trim();
  const pincode = (address?.pincode || '').trim();
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: 'Enter a valid name' }, { status: 400 });
  if (!PHONE.test(phone)) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
  if (line.length < 6 || line.length > 240) return NextResponse.json({ error: 'Enter your delivery address' }, { status: 400 });
  if (!PIN.test(pincode)) return NextResponse.json({ error: 'Enter a valid 6-digit pincode' }, { status: 400 });
  if (!isServiceablePin(pincode)) return NextResponse.json({ error: NOT_SERVICEABLE_MSG }, { status: 400 });
  // Optional — used only for the "delivered / thank you" email.
  const email = String(customer?.email || '').trim().toLowerCase().slice(0, 120);
  if (email && !EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  const method = payment_method === 'razorpay' ? 'razorpay' : 'tryandbuy';

  // ── trusted pricing (server) ──
  let priced;
  try { priced = await priceOrder(items, coupon); }
  catch (e) { return NextResponse.json({ error: e.message || 'Could not price your order' }, { status: 400 }); }

  // ── identify the user (login-gated checkout) ──
  let userId = null;
  const authz = req.headers.get('authorization') || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
  const adminForAuth = getSupabaseAdmin();
  if (token && adminForAuth) {
    try { const { data } = await adminForAuth.auth.getUser(token); userId = data?.user?.id || null; } catch {}
  }
  // demo linkage (no Supabase): trust the client-provided demo id for local history only
  if (!userId && !adminForAuth && body.user_id) userId = String(body.user_id).slice(0, 64);

  const code = makeCode();
  const row = {
    code,
    user_id: userId,
    customer: email ? { name, phone, email } : { name, phone },
    address: {
      line,
      landmark: (address?.landmark || '').trim().slice(0, 120) || null,
      pincode,
      city: (address?.city || 'Gwalior').slice(0, 60),
      notes: (address?.notes || '').trim().slice(0, 200) || null,
      lat: Number.isFinite(Number(address?.lat)) && address?.lat != null ? Number(address.lat) : null,
      lng: Number.isFinite(Number(address?.lng)) && address?.lng != null ? Number(address.lng) : null,
    },
    items: priced.items,
    subtotal: priced.subtotal,
    delivery: priced.delivery,
    discount: priced.discount || 0,
    coupon: priced.coupon || null,
    total: priced.total,
    payment_method: method,
    payment_status: method === 'razorpay' ? 'pending' : 'pay_on_delivery',
    status: 'placed',
    razorpay_order_id: null,
    created_at: new Date().toISOString(),
  };

  // ── Razorpay order (server amount only) ──
  let razorpay = null;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const pubKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId;
  if (method === 'razorpay') {
    if (keyId && keySecret) {
      try {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const ro = await rzp.orders.create({ amount: Math.round(priced.total * 100), currency: 'INR', receipt: code });
        row.razorpay_order_id = ro.id;
        razorpay = { demo: false, orderId: ro.id, amount: ro.amount, keyId: pubKey };
      } catch { return NextResponse.json({ error: 'Could not start payment. Try again.' }, { status: 502 }); }
    } else {
      razorpay = { demo: true, amount: Math.round(priced.total * 100) };
    }
  }

  // ── persist ──
  const admin = getSupabaseAdmin();
  if (admin) {
    // Reserve stock FIRST, atomically. If two people race for the last piece,
    // only one reservation succeeds and the other order is refused — nothing
    // out of stock can ever be ordered.
    const reserved = [];
    const release = async () => {
      for (const it of reserved) {
        try { await admin.rpc('increment_stock', { p_id: it.id, p_qty: it.qty }); } catch {}
      }
    };
    for (const it of priced.lines) {
      const { data: ok, error: rErr } = await admin.rpc('reserve_stock', { p_id: it.id, p_qty: it.qty });
      if (rErr) {
        // reserve_stock not installed yet — fall back to the old guarded decrement
        try { await admin.rpc('decrement_stock', { p_id: it.id, p_qty: it.qty }); } catch {}
        continue;
      }
      if (ok !== true) {
        await release();
        return NextResponse.json({ error: `${it.name} just went out of stock. Please remove it from your bag.` }, { status: 409 });
      }
      reserved.push(it);
    }

    let { error } = await admin.from('orders').insert(row);
    if (error) {
      console.error('[orders] insert error #1:', error.message, error.details || '', error.hint || '');
      // discount/coupon columns may not exist yet — retry without them so orders still work
      const { discount, coupon, ...rest } = row;
      const retry = await admin.from('orders').insert(rest);
      if (retry.error) {
        console.error('[orders] insert error #2:', retry.error.message, retry.error.details || '', retry.error.hint || '');
        await release();
        return NextResponse.json({ error: 'Could not place order. Try again.' }, { status: 500 });
      }
    }
    // Owner email + customer push. Awaited (with a cap): on Vercel a function
    // can be frozen the moment it responds, which used to drop these silently.
    // A prepaid order gets its customer push once the payment is confirmed.
    await Promise.allSettled([
      withTimeout(notifyOrderEmail(row), 6000),
      reserved.length ? withTimeout(lowStockAlert(admin, reserved), 6000) : null,
      method === 'razorpay' ? null : withTimeout(notifyOrderStatus(admin, row, 'placed'), 5000),
    ]);
    return NextResponse.json({ code, total: priced.total, persisted: true, razorpay });
  }

  // demo mode (no Supabase service key): client keeps it in localStorage for tracking
  return NextResponse.json({ code, total: priced.total, persisted: false, order: row, razorpay });
}