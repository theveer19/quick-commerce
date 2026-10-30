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

// ── Who may use a coupon ────────────────────────────────────────────────────
// Extra rules per code (no database change needed). A coupon row may also
// carry first_order_only / app_only columns — either source switches a rule on.
export const COUPON_RULES = {
  APP100: { firstOrder: true, appOnly: true },
};

/**
 * ctx = { phone, client } — phone: the customer's 10-digit number,
 * client: 'app' when the request comes from the Android app.
 * Returns { ok, reason }.
 */
export async function checkCouponEligibility(coupon, ctx = {}) {
  if (!coupon) return { ok: false, reason: 'Invalid coupon code' };
  const code = String(coupon.code || '').toUpperCase();
  const rule = { ...(COUPON_RULES[code] || {}) };
  if (coupon.first_order_only) rule.firstOrder = true;
  if (coupon.app_only) rule.appOnly = true;

  if (rule.appOnly && ctx.client !== 'app') {
    return { ok: false, reason: `${code} works only on the OneT India app — get it free on Google Play.` };
  }
  if (rule.firstOrder) {
    const phone = String(ctx.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return { ok: false, reason: `Log in to use ${code}.` };
    const admin = getSupabaseAdmin();
    if (admin) {
      const { count, error } = await admin.from('orders')
        .select('code', { count: 'exact', head: true })
        .eq('customer->>phone', phone)
        .neq('status', 'cancelled');
      if (!error && count > 0) return { ok: false, reason: `${code} is for your first order only.` };
    }
  }
  return { ok: true };
}
