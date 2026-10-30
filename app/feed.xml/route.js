// Google Merchant Center product feed → free listings in Google Shopping.
// Add this URL in Merchant Center: https://www.onet.co.in/feed.xml
import { listActiveProducts } from '@/lib/catalog-server';
import { BRAND, SITE_URL } from '@/lib/config';

export const revalidate = 3600;

const x = (v) => String(v ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const GENDER = { men: 'male', women: 'female', unisex: 'unisex' };

export async function GET() {
  const products = await listActiveProducts().catch(() => []);
  const items = products.map((p) => {
    const images = (p.images?.length ? p.images : [p.image]).filter(Boolean);
    if (!images.length || !(Number(p.price) > 0)) return '';
    const hasSale = Number(p.mrp) > Number(p.price);
    const colors = (p.colors || []).map((c) => c?.name || c).filter(Boolean);
    return `
    <item>
      <g:id>${x(p.id)}</g:id>
      <g:title>${x(String(p.name).slice(0, 150))}</g:title>
      <g:description>${x(String(p.description || p.name).replace(/\s+/g, ' ').slice(0, 4900))}</g:description>
      <g:link>${x(`${SITE_URL}/product/${p.id}`)}</g:link>
      <g:image_link>${x(images[0])}</g:image_link>
      ${images.slice(1, 10).map((u) => `<g:additional_image_link>${x(u)}</g:additional_image_link>`).join('')}
      <g:availability>${Number(p.stock) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${(hasSale ? Number(p.mrp) : Number(p.price)).toFixed(2)} INR</g:price>
      ${hasSale ? `<g:sale_price>${Number(p.price).toFixed(2)} INR</g:sale_price>` : ''}
      <g:brand>${x(BRAND.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>1604</g:google_product_category>
      <g:product_type>${x([p.category, p.subcategory].filter(Boolean).join(' > '))}</g:product_type>
      ${GENDER[p.category] ? `<g:gender>${GENDER[p.category]}</g:gender><g:age_group>adult</g:age_group>` : ''}
      ${colors.length ? `<g:color>${x(colors.slice(0, 3).join('/'))}</g:color>` : ''}
      ${(p.sizes || []).length ? `<g:size>${x(String(p.sizes[0]))}</g:size>` : ''}
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${x(BRAND.name)}</title>
    <link>${SITE_URL}</link>
    <description>${x(BRAND.tagline)}</description>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
}
