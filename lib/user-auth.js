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
    if (data?.user) return normalize(data.user);
    return readDemo(); // demo-OTP fallback until real SMS is set up
  }
  return readDemo();
}

export { SUPABASE_READY };

/* ── Phone OTP login ─────────────────────────────────────────── */
export async function sendOtp(phone) {
  try {
    const r = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
    const j = await r.json();
    if (j.sent) return { demo: false };        // real SMS sent via MSG91
    if (j.configured !== false && !r.ok) throw new Error(j.error || 'Could not send OTP');
    // configured === false → fall through to demo
  } catch (e) {
    if (e?.message && e.message !== 'Failed to fetch') throw e; // real error → surface it
    // network/other → demo fallback
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem('onet_otp_demo', JSON.stringify({ phone, code }));
  return { demo: true, code };
}

function finishLocalLogin(phone) {
  const user = { id: 'user-' + phone, name: '', phone, email: phone + '@onet.local' };
  localStorage.setItem(DEMO_KEY, JSON.stringify(user));
  localStorage.removeItem('onet_otp_demo');
  window.dispatchEvent(new Event('onet-auth'));
  return user;
}

export async function verifyOtp(phone, token) {
  const rawPending = typeof window !== 'undefined' ? localStorage.getItem('onet_otp_demo') : null;
  const pending = rawPending ? JSON.parse(rawPending) : null;
  if (pending && pending.phone === phone) {
    if (pending.code !== String(token).trim()) throw new Error('Invalid OTP. Please try again.');
    return finishLocalLogin(phone);
  }
  const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp: token }) });
  const j = await r.json();
  if (j.verified) return finishLocalLogin(phone);
  throw new Error(j.message || 'Invalid OTP');
}

export async function updateName(name) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data: sess } = await sb.auth.getUser();
    if (sess?.user) {
      const { data, error } = await sb.auth.updateUser({ data: { name } });
      if (error) throw error;
      try { const uid = data?.user?.id; if (uid) await sb.from('profiles').update({ name }).eq('id', uid); } catch {}
      window.dispatchEvent(new Event('onet-auth'));
      return normalize(data.user);
    }
    // fall through to demo user
  }
  const raw = localStorage.getItem(DEMO_KEY);
  const u = raw ? JSON.parse(raw) : null;
  if (u) { u.name = name; localStorage.setItem(DEMO_KEY, JSON.stringify(u)); window.dispatchEvent(new Event('onet-auth')); }
  return u;
}