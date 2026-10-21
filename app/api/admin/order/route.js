import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin updates order status / delivery partner / customer details via
// service-role (bypasses RLS), after verifying the caller is an admin.
const PHONE = /^[6-9]\d{9}$/;
export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const authz = req.headers.get('authorization') || '';
  const token = authz.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — not an admin' }, { status: 403 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const { code, status, partner, customer } = body || {};
  if (!code) return NextResponse.json({ error: 'Missing order code' }, { status: 400 });

  const patch = {};
  if (typeof status === 'string') {
    patch.status = status;
    if (status === 'delivered') patch.delivered_at = new Date().toISOString();
  }
  if (partner !== undefined) patch.delivery_partner = partner;

  // Fixing a name or number the customer mistyped at checkout. Only the fields
  // sent are touched, and they are merged into the stored object rather than
  // replacing it — otherwise correcting a name would wipe the phone number the
  // rider needs.
  if (customer && typeof customer === 'object') {
    const next = {};
    if (customer.name !== undefined) {
      const name = String(customer.name).trim();
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json({ error: 'Enter a valid name' }, { status: 400 });
      }
      next.name = name;
    }
    if (customer.phone !== undefined) {
      const phone = String(customer.phone).replace(/\D/g, '');
      if (!PHONE.test(phone)) {
        return NextResponse.json({ error: 'Enter a valid 10-digit mobile number' }, { status: 400 });
      }
      next.phone = phone;
    }
    if (Object.keys(next).length) {
      const { data: row } = await admin.from('orders').select('customer').eq('code', code).maybeSingle();
      if (!row) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      patch.customer = { ...(row.customer || {}), ...next };
    }
  }

  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await admin.from('orders').update(patch).eq('code', code).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || { ok: true });
}