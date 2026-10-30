// Server wrapper for the (client-side) product page: gives Google and
// WhatsApp/Instagram link previews a real title, description, image and
// price, plus Product structured data for rich results.
import { getProductForSeo } from '@/lib/catalog-server';
import { BRAND, SITE_URL } from '@/lib/config';

export const revalidate = 600;

const clean = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function generateMetadata({ params }) {
  const p = await getProductForSeo(params.id).catch(() => null);
  if (!p) return { title: 'Product' };
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const title = `${p.name} — ₹${p.price}${off ? ` (${off}% off)` : ''}`;
  const description = clean(p.description, 140) || `Buy ${p.name} online in ${BRAND.city}. Delivered in minutes — try it on at your door, pay only for what you keep.`;
  const image = (p.images && p.images[0]) || p.image;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${p.id}` },
    openGraph: { title, description, url: `${SITE_URL}/product/${p.id}`, type: 'website', images: image ? [{ url: image }] : [] },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
  };
}

export default async function ProductLayout({ children, params }) {
  const p = await getProductForSeo(params.id).catch(() => null);
  if (!p) return children;
  const images = (p.images?.length ? p.images : [p.image]).filter(Boolean).slice(0, 6);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: clean(p.description, 500) || p.name,
    image: images,
    sku: String(p.id),
    brand: { '@type': 'Brand', name: BRAND.name },
    category: [p.category, p.subcategory].filter(Boolean).join(' > '),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${p.id}`,
      priceCurrency: 'INR',
      price: Number(p.price),
      availability: Number(p.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND.name },
      areaServed: { '@type': 'City', name: BRAND.city },
    },
    ...(Number(p.rating_count) > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(p.rating_avg), reviewCount: Number(p.rating_count) } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      {children}
    </>
  );
}
