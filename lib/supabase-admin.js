// Server-ONLY Supabase client using the service role key.
// Bypasses RLS. NEVER import this from a client component.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const ADMIN_READY = Boolean(url && serviceKey);

export function getSupabaseAdmin() {
  if (!ADMIN_READY) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
