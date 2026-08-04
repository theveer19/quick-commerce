import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const code = String(params.code || '').slice(0, 40);
  const { data, error } = await admin.from('orders').select('*').eq('code', code).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}
