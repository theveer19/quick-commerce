'use client';
// Unified data layer. Uses Supabase when configured, otherwise seed data.
// This lets the entire storefront + admin run before any keys are added.
import { getSupabaseBrowser } from './supabase-browser';
import { SEED_PRODUCTS } from './seed';
import { SUPABASE_READY } from './config';
import { demoUserId } from './user-auth';

const LS_ORDERS = 'onet_orders_demo';
const LS_PRODUCTS = 'onet_products_demo';

/* ---------------- Products ---------------- */
function localProducts() {
  if (typeof window === 'undefined') return SEED_PRODUCTS;
  try {
    const raw = localStorage.getItem(LS_PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  return SEED_PRODUCTS;
}
function saveLocalProducts(list) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_PRODUCTS, JSON.stringify(list));
}

export async function fetchProducts({ category, sub, search } = {}) {
  const sb = getSupabaseBrowser();
  if (sb) {
    let q = sb.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (category) q = q.eq('category', category);
    if (sub) q = q.eq('subcategory', sub);
    const { data, error } = await q;
    if (error) throw error;
    let rows = data || [];
    if (search) rows = rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return rows;
  }
  let rows = localProducts().filter((p) => p.is_active !== false);
  if (category) rows = rows.filter((p) => p.category === category);
  if (sub) rows = rows.filter((p) => p.subcategory === sub);
  if (search) rows = rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return rows;
}

export async function fetchProduct(id) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
  return localProducts().find((p) => String(p.id) === String(id)) || null;
}

/* ---------------- Admin: product CRUD ---------------- */
export async function adminListProducts() {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return localProducts();
}
export async function saveProduct(p) {
  const sb = getSupabaseBrowser();
  if (sb) {
    if (p.id) {
      const { data, error } = await sb.from('products').update(p).eq('id', p.id).select().single();
      if (error) throw error; return data;
    }
    const { data, error } = await sb.from('products').insert(p).select().single();
    if (error) throw error; return data;
  }
  const list = localProducts();
  if (p.id) {
    const idx = list.findIndex((x) => String(x.id) === String(p.id));
    list[idx] = { ...list[idx], ...p };
  } else {
    list.unshift({ ...p, id: 'p' + Date.now() });
  }
  saveLocalProducts(list);
  return p;
}
export async function deleteProduct(id) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw error; return true;
  }
  saveLocalProducts(localProducts().filter((x) => String(x.id) !== String(id)));
  return true;
}
export async function updateStock(id, stock) {
  return saveProduct({ id, stock: Number(stock) });
}

/* ---------------- Orders ---------------- */
export const ORDER_STAGES = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
export const STAGE_LABEL = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function localOrders() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_ORDERS) || '[]'); } catch { return []; }
}
function saveLocalOrders(list) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_ORDERS, JSON.stringify(list));
}

// Order creation goes through the secure server API (/api/orders), which
// computes prices, validates stock and totals server-side. The client never
// sets prices. Returns { code, total, persisted, order?, razorpay? }.
async function authHeader() {
  const sb = getSupabaseBrowser();
  if (!sb) return {};
  try {
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}


function rememberMyOrder(o) {
  if (typeof window === 'undefined' || !o?.code) return;
  try {
    const list = JSON.parse(localStorage.getItem('onet_my_orders') || '[]');
    if (!list.find((x) => x.code === o.code)) { list.unshift(o); localStorage.setItem('onet_my_orders', JSON.stringify(list.slice(0, 50))); }
  } catch {}
}
export function myRememberedOrders() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('onet_my_orders') || '[]'); } catch { return []; }
}

export async function placeOrder(payload) {
  const extra = await authHeader();
  const body = { ...payload, user_id: demoUserId() || undefined }; // demo linkage; real mode uses the token
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not place order');
  // If not persisted to a database (demo/local mode), keep it for tracking.
  if (!data.persisted && data.order) saveDemoOrder(data.order);
  // Remember for the customer's order history (covers demo/guest logins too).
  rememberMyOrder({ code: data.code, total: data.total, status: 'placed', created_at: new Date().toISOString(), items: payload.items, customer: payload.customer, address: payload.address });
  return data;
}

// demo/local persistence helpers (only used when there is no DB)
export function saveDemoOrder(order) {
  const list = localOrders();
  list.unshift(order);
  saveLocalOrders(list);
}
export function markPaidLocal(code, paymentId) {
  const list = localOrders();
  const i = list.findIndex((o) => o.code === code);
  if (i >= 0) {
    list[i].payment_status = 'paid';
    list[i].payment_id = paymentId;
    list[i].status = 'confirmed';
    saveLocalOrders(list);
  }
}

export async function fetchOrder(code) {
  // Prefer LIVE server data (has latest status + delivery partner set by admin)
  if (SUPABASE_READY) {
    try {
      const r = await fetch('/api/orders/' + encodeURIComponent(code));
      if (r.ok) {
        const data = await r.json();
        if (data && data.code) return data;
      }
    } catch {}
  }
  // fall back to local copy (demo mode / freshly placed / server miss)
  const local = localOrders().find((o) => o.code === code);
  if (local) return local;
  return null;
}
export async function fetchMyOrders() {
  const out = new Map();
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    if (u?.user) {
      const { data } = await sb.from('orders').select('*').eq('user_id', u.user.id).order('created_at', { ascending: false });
      (data || []).forEach((o) => out.set(o.code, o));
    }
  }
  // locally remembered orders (demo login + guest orders) — fetch live status
  for (const r of myRememberedOrders()) {
    if (out.has(r.code)) continue;
    let full = null;
    try { full = await fetchOrder(r.code); } catch {}
    out.set(r.code, full || r);
  }
  if (!sb) {
    const uid = demoUserId();
    localOrders().filter((o) => o.user_id && o.user_id === uid).forEach((o) => { if (!out.has(o.code)) out.set(o.code, o); });
  }
  return Array.from(out.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function adminListOrders() {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data || [];
  }
  return localOrders();
}
export async function updateOrderStatus(code, status) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.from('orders').update({ status }).eq('code', code).select().single();
    if (error) throw error; return data;
  }
  const list = localOrders();
  const idx = list.findIndex((o) => o.code === code);
  if (idx >= 0) { list[idx].status = status; saveLocalOrders(list); }
  return list[idx];
}


export async function updateOrderPartner(code, partner) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.from('orders').update({ delivery_partner: partner }).eq('code', code).select().single();
    if (error) throw error; return data;
  }
  const list = localOrders();
  const idx = list.findIndex((o) => o.code === code);
  if (idx >= 0) { list[idx].delivery_partner = partner; saveLocalOrders(list); }
  return list[idx];
}

export { SUPABASE_READY };