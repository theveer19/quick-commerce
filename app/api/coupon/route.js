import { NextResponse } from 'next/server';
import { loadCoupon, computeDiscount } from '@/lib/coupon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const code = (body?.code || '').trim();
  const subtotal = Math.max(0, Number(body?.subtotal) || 0);
  if (!code) return NextResponse.json({ valid: false, message: 'Enter a coupon code' });

  const coupon = await loadCoupon(code);
  const r = computeDiscount(coupon, subtotal);
  if (!r.ok) return NextResponse.json({ valid: false, message: r.reason });
  return NextResponse.json({ valid: true, code: r.code, discount: r.discount, message: `Coupon ${r.code} applied` });
}