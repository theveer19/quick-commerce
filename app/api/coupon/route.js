import { NextResponse } from 'next/server';
import { loadCoupon, computeDiscount, checkCouponEligibility } from '@/lib/coupon';
import { phoneFromRequest } from '@/lib/session';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!rateLimit(req, { key: 'coupon', limit: 20, windowMs: 60000 }))
    return NextResponse.json({ valid: false, message: 'Too many attempts. Please wait a minute.' }, { status: 429 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const code = (body?.code || '').trim();
  const subtotal = Math.max(0, Number(body?.subtotal) || 0);
  if (!code) return NextResponse.json({ valid: false, message: 'Enter a coupon code' });

  const coupon = await loadCoupon(code);
  const r = computeDiscount(coupon, subtotal);
  if (!r.ok) return NextResponse.json({ valid: false, message: r.reason });
  const who = await checkCouponEligibility(coupon, {
    phone: phoneFromRequest(req),
    client: req.headers.get('x-onet-client') === 'app' ? 'app' : 'web',
  });
  if (!who.ok) return NextResponse.json({ valid: false, message: who.reason });
  return NextResponse.json({ valid: true, code: r.code, discount: r.discount, message: `Coupon ${r.code} applied` });
}