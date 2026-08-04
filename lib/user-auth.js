'use client';
// Customer authentication. Uses Supabase Auth when configured; otherwise a
// lightweight demo login (localStorage) so the flow works before keys are added.
import { getSupabaseBrowser } from './supabase-browser';
import { SUPABASE_READY } from './config';

const DEMO_KEY = 'onet_user_demo';

function readDemo() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch { return null; }
}
export function demoUserId() {
  const u = readDemo();
  return u?.id || null;
}

function normalize(u) {
  if (!u) return null;
  const meta = u.user_metadata || {};
  return { id: u.id, email: u.email, name: meta.name || u.name || '', phone: meta.phone || u.phone || '' };
}

export async function signUp({ name, phone, email, password }) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { name, phone } },
    });
    if (error) throw error;
    // if email confirmation is OFF, session is active immediately
    return normalize(data.user);
  }
  // demo
  const user = { id: 'demo-' + (phone || Date.now()), name, phone, email: email || `${phone}@demo.local`, demo: true };
  localStorage.setItem(DEMO_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('onet-auth'));
  return user;
}

export async function signIn({ email, password }) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return normalize(data.user);
  }
  // demo: accept anything, remember a demo user
  const existing = readDemo();
  const user = existing || { id: 'demo-' + Date.now(), name: 'Guest', phone: '', email: email || 'guest@demo.local', demo: true };
  localStorage.setItem(DEMO_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('onet-auth'));
  return user;
}

export async function signOutUser() {
  const sb = getSupabaseBrowser();
  if (sb) { try { await sb.auth.signOut(); } catch {} }
  if (typeof window !== 'undefined') { localStorage.removeItem(DEMO_KEY); window.dispatchEvent(new Event('onet-auth')); }
}

export async function getCurrentUser() {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data } = await sb.auth.getUser();
    return normalize(data.user);
  }
  return readDemo();
}

export { SUPABASE_READY };

/* ── Phone OTP login ─────────────────────────────────────────── */
export async function sendOtp(phone) {
  const full = '+91' + phone;
  const sb = getSupabaseBrowser();
  if (sb) {
    const { error } = await sb.auth.signInWithOtp({ phone: full });
    if (error) throw error;
    return { demo: false };
  }
  // demo: generate a code locally and reveal it in the UI
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem('onet_otp_demo', JSON.stringify({ phone, code }));
  return { demo: true, code };
}

export async function verifyOtp(phone, token) {
  const full = '+91' + phone;
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.auth.verifyOtp({ phone: full, token, type: 'sms' });
    if (error) throw error;
    window.dispatchEvent(new Event('onet-auth'));
    return normalize(data.user);
  }
  const raw = localStorage.getItem('onet_otp_demo');
  const p = raw ? JSON.parse(raw) : null;
  if (!p || p.phone !== phone || p.code !== String(token).trim()) throw new Error('Invalid OTP. Please try again.');
  const user = { id: 'demo-' + phone, name: '', phone, email: `${phone}@demo.local`, demo: true };
  localStorage.setItem('onet_user_demo', JSON.stringify(user));
  localStorage.removeItem('onet_otp_demo');
  window.dispatchEvent(new Event('onet-auth'));
  return user;
}

export async function updateName(name) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.auth.updateUser({ data: { name } });
    if (error) throw error;
    try { const uid = data?.user?.id; if (uid) await sb.from('profiles').update({ name }).eq('id', uid); } catch {}
    window.dispatchEvent(new Event('onet-auth'));
    return normalize(data.user);
  }
  const raw = localStorage.getItem(DEMO_KEY);
  const u = raw ? JSON.parse(raw) : null;
  if (u) { u.name = name; localStorage.setItem(DEMO_KEY, JSON.stringify(u)); window.dispatchEvent(new Event('onet-auth')); }
  return u;
}