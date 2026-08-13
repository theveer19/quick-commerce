// Coupon loading + discount math — used by server pricing and the validate API.
import { getSupabaseAdmin } from './supabase-admin';

export async function loadCoupon(code) {
  if (!code) return null;
  const c = String(code).trim().toUpperCase();
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.from('coupons').select('*').eq('code', c).maybeSingle();
    return data || null;
  }
  // demo fallback (no Supabase key)
  const DEMO = { FREEDOM: { code: 'FREEDOM', type: 'flat', value: 150, min_order: 499, active: true } };
  return DEMO[c] || null;
}

export function computeDiscount(coupon, subtotal) {
  if (!coupon) return { ok: false, discount: 0, reason: 'Invalid coupon code' };
  if (coupon.active === false) return { ok: false, discount: 0, reason: 'This coupon is not active' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { ok: false, discount: 0, reason: 'This coupon has expired' };
  const min = Number(coupon.min_order || 0);
  if (subtotal < min) return { ok: false, discount: 0, reason: `Add ₹${min - subtotal} more to use ${coupon.code}` };
  let discount = coupon.type === 'percent' ? Math.round((subtotal * Number(coupon.value)) / 100) : Number(coupon.value);
  if (coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok: true, discount, reason: 'Applied', code: coupon.code };
}