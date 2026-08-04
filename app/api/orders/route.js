import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { priceOrder } from '@/lib/pricing';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PHONE = /^[6-9]\d{9}$/;
const PIN = /^\d{6}$/;

function makeCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ONET-${y}${m}${day}-${r}`;
}

export async function POST(req) {
  if (!rateLimit(req, { key: 'orders', limit: 8, windowMs: 60000 }))
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const { items, customer, address, payment_method } = body || {};

  // ── server-side validation ──
  const name = (customer?.name || '').trim();
  const phone = (customer?.phone || '').trim();
  const line = (address?.line || '').trim();
  const pincode = (address?.pincode || '').trim();
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: 'Enter a valid name' }, { status: 400 });
  if (!PHONE.test(phone)) return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
  if (line.length < 6 || line.length > 240) return NextResponse.json({ error: 'Enter your delivery address' }, { status: 400 });
  if (!PIN.test(pincode)) return NextResponse.json({ error: 'Enter a valid 6-digit pincode' }, { status: 400 });
  const method = payment_method === 'razorpay' ? 'razorpay' : 'tryandbuy';

  // ── trusted pricing (server) ──
  let priced;
  try { priced = await priceOrder(items); }
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
    customer: { name, phone },
    address: {
      line,
      landmark: (address?.landmark || '').trim().slice(0, 120) || null,
      pincode,
      city: (address?.city || 'Gwalior').slice(0, 60),
      notes: (address?.notes || '').trim().slice(0, 200) || null,
    },
    items: priced.items,
    subtotal: priced.subtotal,
    delivery: priced.delivery,
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
    const { error } = await admin.from('orders').insert(row);
    if (error) return NextResponse.json({ error: 'Could not place order. Try again.' }, { status: 500 });
    // atomic-per-row stock decrement (guarded so stock never goes negative)
    for (const it of priced.items) {
      try { await admin.rpc('decrement_stock', { p_id: it.id, p_qty: it.qty }); } catch {}
    }
    return NextResponse.json({ code, total: priced.total, persisted: true, razorpay });
  }

  // demo mode (no Supabase service key): client keeps it in localStorage for tracking
  return NextResponse.json({ code, total: priced.total, persisted: false, order: row, razorpay });
}
