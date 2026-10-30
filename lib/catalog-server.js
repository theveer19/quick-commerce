// Server-ONLY: read the live catalogue for SEO (sitemap, product pages, feed).
import { getSupabaseAdmin } from './supabase-admin';

const FIELDS = 'id,name,description,price,mrp,stock,image,images,category,subcategory,colors,sizes,is_active,created_at,rating_avg,rating_count';

export async function listActiveProducts(limit = 2000) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  let { data, error } = await admin.from('products').select(FIELDS).eq('is_active', true).order('created_at', { ascending: false }).limit(limit);
  if (error) ({ data } = await admin.from('products').select('*').eq('is_active', true).limit(limit)); // before the reviews SQL is run
  return data || [];
}

export async function getProductForSeo(id) {
  if (!/^[0-9a-zA-Z-]{1,64}$/.test(String(id || ''))) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from('products').select('*').eq('id', id).maybeSingle();
  return data || null;
}
