// Server-side order pricing. Prices, stock and totals are ALWAYS computed here
// from trusted data (DB or seed) — never from anything the client sends.
import { getSupabaseAdmin } from './supabase-admin';
import { SEED_PRODUCTS } from './seed';
import { BRAND } from './config';
import { loadCoupon, computeDiscount } from './coupon';

async function loadProductsByIds(ids) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('products').select('*').in('id', ids);
    if (error) throw new Error('Could not load products');
    return data || [];
  }
  return SEED_PRODUCTS.filter((p) => ids.includes(String(p.id)));
}

export async function priceOrder(rawItems, couponCode) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new Error('Your bag is empty');
  if (rawItems.length > 40) throw new Error('Too many items');

  const wanted = rawItems.map((i) => ({
    id: String(i.id),
    size: i.size ? String(i.size).slice(0, 24) : null,
    color: i.color ? String(i.color).slice(0, 32) : null,
    qty: Math.max(1, Math.min(10, parseInt(i.qty, 10) || 1)),
  }));

  const ids = [...new Set(wanted.map((w) => w.id))];
  const products = await loadProductsByIds(ids);
  const byId = new Map(products.map((p) => [String(p.id), p]));

  const items = [];
  for (const w of wanted) {
    const p = byId.get(w.id);
    if (!p) throw new Error('A product in your bag is no longer available');
    if (p.is_active === false) throw new Error(`${p.name} is unavailable`);
    if ((p.stock ?? 0) < w.qty) throw new Error(`${p.name} is out of stock`);
    items.push({ id: String(p.id), name: p.name, size: w.size, color: w.color, qty: w.qty, price: Number(p.price) });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= BRAND.freeDeliveryAbove ? 0 : BRAND.deliveryFee;

  let discount = 0, coupon = null;
  if (couponCode) {
    const c = await loadCoupon(couponCode);
    const r = computeDiscount(c, subtotal);
    if (r.ok) { discount = r.discount; coupon = r.code; }
  }

  const total = Math.max(0, subtotal + delivery - discount);
  return { items, subtotal, delivery, discount, coupon, total };
}