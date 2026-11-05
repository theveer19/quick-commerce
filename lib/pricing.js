// Server-side order pricing. Prices, stock and totals are ALWAYS computed here
// from trusted data (DB or seed) — never from anything the client sends.
import { getSupabaseAdmin } from './supabase-admin';
import { SEED_PRODUCTS } from './seed';
import { BRAND } from './config';
import { loadCoupon, computeDiscount, checkCouponEligibility } from './coupon';
import { hasSizeStock, sizeQty } from './stock';

async function loadProductsByIds(ids) {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('products').select('*').in('id', ids);
    if (error) throw new Error('Could not load products');
    return data || [];
  }
  return SEED_PRODUCTS.filter((p) => ids.includes(String(p.id)));
}

export async function priceOrder(rawItems, couponCode, ctx = {}) {
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
  // Total quantity asked for per product, across sizes/colours — two bag lines
  // of the same product must not together exceed what is in stock.
  const perProduct = new Map();
  for (const w of wanted) {
    const p = byId.get(w.id);
    if (!p) throw new Error('A product in your bag is no longer available');
    if (p.is_active === false) throw new Error(`${p.name} is unavailable`);
    const sizes = Array.isArray(p.sizes) ? p.sizes.map(String) : [];
    if (sizes.length && w.size && !sizes.includes(w.size)) throw new Error(`Size ${w.size} is not available for ${p.name}`);
    if (hasSizeStock(p) && !w.size) throw new Error(`Please choose a size for ${p.name}`);
    perProduct.set(w.id, (perProduct.get(w.id) || 0) + w.qty);
    items.push({ id: String(p.id), name: p.name, image: p.image || (Array.isArray(p.images) ? p.images[0] : null), size: w.size, color: w.color, qty: w.qty, price: Number(p.price) });
  }
  // What to take off the shelf. Size-tracked products: one line per size;
  // others: one line per product (total stock).
  const lines = [];
  const perSize = new Map();
  for (const it of items) {
    const p = byId.get(it.id);
    if (!hasSizeStock(p)) continue;
    const k = `${it.id}__${it.size}`;
    perSize.set(k, { id: it.id, size: it.size, qty: (perSize.get(k)?.qty || 0) + it.qty });
  }
  for (const [id, qty] of perProduct) {
    const p = byId.get(id);
    if (hasSizeStock(p)) continue;
    const stock = Number(p.stock ?? 0);
    if (stock <= 0) throw new Error(`${p.name} is out of stock`);
    if (stock < qty) throw new Error(`Only a limited quantity of ${p.name} is available. Please reduce the quantity.`);
    lines.push({ id, name: p.name, qty, size: null, bySize: false });
  }
  for (const l of perSize.values()) {
    const p = byId.get(l.id);
    const have = sizeQty(p, l.size);
    if (have <= 0) throw new Error(`${p.name} in size ${l.size} is sold out. Please pick another size.`);
    if (have < l.qty) throw new Error(`Only a limited quantity of ${p.name} in size ${l.size} is available. Please reduce the quantity.`);
    lines.push({ id: l.id, name: p.name, qty: l.qty, size: l.size, bySize: true });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= BRAND.freeDeliveryAbove ? 0 : BRAND.deliveryFee;

  let discount = 0, coupon = null;
  if (couponCode) {
    const c = await loadCoupon(couponCode);
    const r = computeDiscount(c, subtotal);
    if (r.ok) {
      // first-order / app-only coupons: refuse loudly rather than silently
      // charging more than the customer saw at checkout
      const who = await checkCouponEligibility(c, ctx);
      if (!who.ok) throw new Error(who.reason);
      discount = r.discount; coupon = r.code;
    }
  }

  const total = Math.max(0, subtotal + delivery - discount);
  return { items, lines, subtotal, delivery, discount, coupon, total };
}