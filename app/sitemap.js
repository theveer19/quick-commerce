import { listActiveProducts } from '@/lib/catalog-server';
import { SITE_URL } from '@/lib/config';
import { CATEGORIES } from '@/lib/seed';

export const revalidate = 3600; // rebuilt at most once an hour

export default async function sitemap() {
  const now = new Date();
  const pages = ['', '/products', '/offers', '/how-it-works', '/help', '/track',
    '/shipping-policy', '/return-policy', '/refund-policy', '/privacy-policy', '/terms'];
  const products = await listActiveProducts().catch(() => []);
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: p === '' ? 'daily' : 'weekly', priority: p === '' ? 1 : 0.6 })),
    ...CATEGORIES.map((c) => ({ url: `${SITE_URL}/products?category=${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.id}`, lastModified: p.created_at ? new Date(p.created_at) : now, changeFrequency: 'weekly', priority: 0.7 })),
  ];
}
