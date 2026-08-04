'use client';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON, SUPABASE_READY } from './config';

let _client = null;
export function getSupabaseBrowser() {
  if (!SUPABASE_READY) return null;
  if (!_client) _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  return _client;
}
