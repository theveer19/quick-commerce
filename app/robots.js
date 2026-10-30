import { SITE_URL } from '@/lib/config';

export default function robots() {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/checkout', '/cart', '/account', '/orders', '/order/', '/pay/', '/invoice/', '/login', '/wishlist', '/delete-account'],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
