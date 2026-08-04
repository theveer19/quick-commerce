'use client';
import { getSupabaseBrowser } from './supabase-browser';
import { demoUserId } from './user-auth';

const KEY = 'onet_addresses_demo';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const writeLocal = (a) => localStorage.setItem(KEY, JSON.stringify(a));

export async function listAddresses() {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return [];
    const { data, error } = await sb.from('addresses').select('*')
      .order('is_default', { ascending: false }).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }
  const uid = demoUserId();
  return readLocal().filter((a) => a.user_id === uid);
}

export async function addAddress(addr) {
  const sb = getSupabaseBrowser();
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    const row = { ...addr, user_id: u?.user?.id };
    const { data, error } = await sb.from('addresses').insert(row).select().single();
    if (error) throw error;
    return data;
  }
  const uid = demoUserId();
  const row = { ...addr, id: 'a' + Date.now(), user_id: uid, created_at: new Date().toISOString() };
  const all = readLocal(); all.unshift(row); writeLocal(all);
  return row;
}

export async function deleteAddress(id) {
  const sb = getSupabaseBrowser();
  if (sb) { await sb.from('addresses').delete().eq('id', id); return; }
  writeLocal(readLocal().filter((a) => a.id !== id));
}