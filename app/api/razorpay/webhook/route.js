import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Razorpay calls this server-to-server, so it is the reliable confirmation:
// the customer can close the tab the second the money leaves their account and
// the order still gets marked paid.
//
// Setup (both halves are needed, or payments go unrecorded):
//   1. Razorpay Dashboard > Account & Settings > Webhooks > Add New Webhook
//      URL    https://<your-domain>/api/razorpay/webhook
//      Events payment.captured, payment.failed, order.paid
//      Secret any long random string you choose
//   2. Vercel > Settings > Environment Variables
//      RAZORPAY_WEBHOOK_SECRET = that same string, then redeploy
export async function POST(req) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');
  const raw = await req.text();

  // Fail closed. This used to answer "ok" when the secret was missing, so an
  // unconfigured webhook looked healthy to Razorpay while every payment it
  // reported was thrown away.
  if (!secret) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set — payment not recorded');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  if (!signature) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  let ok = false;
  try { ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch {}
  if (!ok) {
    console.error('[razorpay/webhook] bad signature');
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }

  const type = event?.event;
  const payment = event?.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id || event?.payload?.order?.entity?.id;
  if (!rzpOrderId) return NextResponse.json({ ok: true, ignored: type });

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('[razorpay/webhook] no service role key — payment not recorded', { rzpOrderId });
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  if (type === 'payment.captured' || type === 'order.paid') {
    const { data } = await admin.from('orders')
      .update({ payment_status: 'paid', payment_id: payment?.id || null })
      .eq('razorpay_order_id', rzpOrderId)
      .neq('payment_status', 'paid')          // idempotent: Razorpay retries
      .select('code,status')
      .maybeSingle();

    // Only ever move an order forward, never back from packed or delivered.
    if (data?.status === 'placed') {
      await admin.from('orders').update({ status: 'confirmed' }).eq('code', data.code);
    }
    return NextResponse.json({ ok: true, recorded: Boolean(data) });
  }

  if (type === 'payment.failed') {
    await admin.from('orders')
      .update({ payment_status: 'failed' })
      .eq('razorpay_order_id', rzpOrderId)
      .neq('payment_status', 'paid');         // a later success must win
    return NextResponse.json({ ok: true, recorded: true });
  }

  return NextResponse.json({ ok: true, ignored: type });
}
