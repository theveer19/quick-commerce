'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { BRAND } from '@/lib/config';

const groups = [
  {
    title: 'Shop',
    links: [
      ['Women', '/products?category=women'],
      ['Men', '/products?category=men'],
      ['Footwear', '/products?category=footwear'],
      ['Ethnic', '/products?category=ethnic'],
      ['All products', '/products'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Help & Support', '/help'],
      ['Track order', '/track'],
      ['Contact us', '/help#contact'],
      ['FAQs', '/help#faq'],
    ],
  },
  {
    title: 'Policies',
    links: [
      ['Shipping policy', '/shipping-policy'],
      ['Return policy', '/return-policy'],
      ['Refund policy', '/refund-policy'],
      ['Privacy policy', '/privacy-policy'],
      ['Terms & conditions', '/terms'],
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="relative z-[2] border-t border-line bg-surface/40 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-extrabold text-ivory">OneT</span>
              <span className="font-display text-2xl font-extrabold text-rose">India</span>
            </div>
            <p className="mt-3 text-sm text-muted max-w-xs">{BRAND.tagline}. Order the trend, try it at your door, keep only what you love.</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <MapPin size={16} className="text-rose" /> {BRAND.address}
            </div>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="p-2.5 rounded-full border border-line hover:border-rose hover:text-rose transition-colors"><Instagram size={18} /></a>
              <a href="#" aria-label="WhatsApp" className="p-2.5 rounded-full border border-line hover:border-mint hover:text-mint transition-colors"><MessageCircle size={18} /></a>
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="font-display font-semibold text-ivory mb-4">{g.title}</h4>
              <ul className="space-y-2.5">
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-muted hover:text-ivory transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>© {new Date().getFullYear()} {BRAND.name}. Built in Gwalior.</p>
          <p className="flex items-center gap-2">
            Secure payments by <span className="font-semibold text-ivory">Razorpay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
