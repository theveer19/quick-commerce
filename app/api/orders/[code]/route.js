import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Live order tracking — must NEVER be cached, or the customer sees a stale
// snapshot (status/partner frozen at creation time). force-dynamic keeps the
// route dynamic; force-no-store stops Next from caching the underlying Supabase
// fetch in its Data Cache; revalidate=0 and no-store headers cover the CDN.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate' };

export async function GET(_req, { params }) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const code = String(params.code || '').slice(0, 40);
  const { data, error } = await admin
    .from('orders')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  return NextResponse.json(data, { headers: NO_STORE });
}
