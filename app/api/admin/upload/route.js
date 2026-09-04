import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Uploads a product image to Supabase Storage (bucket: product-images) using the
// service-role key, after verifying the caller is a signed-in admin. Replaces the
// old direct-to-Cloudinary upload. Returns { url } — the public image URL.
const BUCKET = 'product-images';

export async function POST(req) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  // ── verify admin (same pattern as /api/admin/order) ──
  const authz = req.headers.get('authorization') || '';
  const token = authz.replace('Bearer ', '').trim();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: prof } = await admin.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — not an admin' }, { status: 403 });

  // ── read the uploaded file ──
  let form;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const type = file.type || 'image/jpeg';
  if (!type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  if (file.size && file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });

  const ext = (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').split('+')[0];
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage.from(BUCKET).upload(key, buffer, { contentType: type, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message || 'Upload failed' }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(key);
  return NextResponse.json({ url: pub.publicUrl });
}
