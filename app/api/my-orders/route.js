import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns orders for a given phone number so a logged-in customer sees their
// orders on any device (they log in with the same phone). Service-role read.
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ orders: [] });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ orders: [] }); }
  const phone = String(body?.phone || '').replace(/\D/g, '').slice(-10);
  if (phone.length !== 10) return NextResponse.json({ orders: [] });
  const { data, error } = await admin
    .from('orders')
    .select('*')
    .filter('customer->>phone', 'eq', phone)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ orders: [], error: error.message });
  return NextResponse.json({ orders: data || [] });
}