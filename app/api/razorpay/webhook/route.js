import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Razorpay calls this server-to-server. It's the RELIABLE confirmation:
// even if the customer closes the tab after paying, the order still gets marked paid.
// Set the same secret in Razorpay Dashboard > Settings > Webhooks and in env as RAZORPAY_WEBHOOK_SECRET.
export async function POST(req) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');
  const raw = await req.text();

  if (!secret) return NextResponse.json({ ok: true, demo: true }); // not configured yet
  if (!signature) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch {}
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 400 });

  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const type = event?.event;
  const rzpOrderId = event?.payload?.payment?.entity?.order_id || event?.payload?.order?.entity?.id;
  const paymentId = event?.payload?.payment?.entity?.id || null;

  if ((type === 'payment.captured' || type === 'order.paid') && rzpOrderId) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from('orders')
          .update({ payment_status: 'paid', payment_id: paymentId, status: 'confirmed' })
          .eq('razorpay_order_id', rzpOrderId)
          .neq('payment_status', 'paid'); // idempotent
      } catch {}
    }
  }
  return NextResponse.json({ ok: true });
}
