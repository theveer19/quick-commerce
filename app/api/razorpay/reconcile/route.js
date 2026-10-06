import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Asks Razorpay what actually happened to every prepaid order the site never
// managed to record, and repairs the rows.
//
// The browser-side verify call only runs while the customer's tab is open, and
// the webhook only helps once it is configured. Anything that slipped through
// either gap sits in the database as "pending" forever, which is how seven
// orders came to be marked delivered while their payment still read pending.
// This route is the backstop: Razorpay is the source of truth, we just read it.
//
// POST /api/razorpay/reconcile          -> every unrecorded prepaid order
// POST /api/razorpay/reconcile {code}   -> just that one
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret)
    return NextResponse.json({ error: 'Razorpay keys are not set' }, { status: 503 });

  // Admin only — same check the other admin routes use.
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — not an admin' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const onlyCode = typeof body?.code === 'string' ? body.code : null;

  let q = admin.from('orders')
    .select('code,status,payment_status,razorpay_order_id,total')
    .eq('payment_method', 'razorpay')
    .neq('payment_status', 'paid')
    .not('razorpay_order_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);
  if (onlyCode) q = q.eq('code', onlyCode);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const report = { checked: 0, paid: 0, failed: 0, unpaid: 0, errors: 0, orders: [] };

  for (const row of rows || []) {
    report.checked += 1;
    let payments = [];
    try {
      const res = await rzp.orders.fetchPayments(row.razorpay_order_id);
      payments = res?.items || [];
    } catch (e) {
      report.errors += 1;
      report.orders.push({ code: row.code, result: 'error', detail: e?.message || 'lookup failed' });
      continue;
    }

    const captured = payments.find((p) => p.status === 'captured');
    if (captured) {
      await admin.from('orders')
        .update({ payment_status: 'paid', payment_id: captured.id })
        .eq('code', row.code);
      // Only ever move an order forward — six of these are already delivered.
      if (row.status === 'placed') {
        await admin.from('orders').update({ status: 'confirmed' }).eq('code', row.code);
      }
      report.paid += 1;
      report.orders.push({
        code: row.code, result: 'paid', payment_id: captured.id,
        amount: captured.amount / 100, method: captured.method,
      });
      continue;
    }

    const failed = payments.find((p) => p.status === 'failed');
    if (failed) {
      await admin.from('orders').update({ payment_status: 'failed' }).eq('code', row.code);
      report.failed += 1;
      report.orders.push({ code: row.code, result: 'failed', reason: failed.error_description || null });
      continue;
    }

    report.unpaid += 1;
    report.orders.push({ code: row.code, result: 'no payment attempted', total: row.total });
  }

  return NextResponse.json(report);
}
