'use client';
import { getSupabaseBrowser } from './supabase-browser';
import { SUPABASE_READY } from './config';

const DEMO_KEY = 'onet_admin_demo';
// Demo password only used when Supabase is NOT configured, so you can preview
// the admin without setup. Replace with real Supabase auth in production.
const DEMO_PASS = 'onet-admin';

export async function signIn(email, password) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
  if (password === DEMO_PASS) {
    localStorage.setItem(DEMO_KEY, '1');
    return { email: email || 'demo@onetindia.in', demo: true };
  }
  throw new Error('Invalid credentials (demo password: onet-admin)');
}

export async function signOut() {
  const sb = getSupabaseBrowser();
  if (sb) await sb.auth.signOut();
  if (typeof window !== 'undefined') localStorage.removeItem(DEMO_KEY);
}

export async function getUser() {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data } = await sb.auth.getUser();
    return data.user;
  }
  if (typeof window !== 'undefined' && localStorage.getItem(DEMO_KEY)) {
    return { email: 'demo@onetindia.in', demo: true };
  }
  return null;
}

export { SUPABASE_READY };