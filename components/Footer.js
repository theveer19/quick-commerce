'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Linkedin, MessageCircle, MapPin, Phone } from 'lucide-react';
import { BRAND } from '@/lib/config';
import AppDownloadBand from './AppDownloadBand';

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
      <AppDownloadBand />
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-extrabold text-ivory">OneT</span>
              <span className="font-display text-2xl font-extrabold text-[#8C1C13]">India</span>
            </div>
            <p className="mt-3 text-sm text-muted max-w-xs">{BRAND.tagline}. Order the trend, try it at your door, keep only what you love.</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <MapPin size={16} className="text-[#8C1C13]" /> {BRAND.address}
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {BRAND.instagram && (
                <a href={`https://instagram.com/${BRAND.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="OneT India on Instagram"
                  className="p-2.5 rounded-full border border-line hover:border-[#8C1C13] hover:text-[#8C1C13] transition-colors"><Instagram size={18} /></a>
              )}
              {BRAND.linkedin && (
                <a href={BRAND.linkedin} target="_blank" rel="noopener noreferrer" aria-label="OneT India on LinkedIn"
                  className="p-2.5 rounded-full border border-line hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors"><Linkedin size={18} /></a>
              )}
              <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium hover:border-mint hover:text-mint transition-colors"><MessageCircle size={17} /> WhatsApp us</a>
              <a href={`tel:${BRAND.phoneTel}`} aria-label="Call us"
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium hover:border-rose hover:text-rose transition-colors"><Phone size={16} /> Call</a>
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

       <div className="mt-12 pt-6 border-t border-line flex flex-col gap-3 text-sm text-muted">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <p>© {new Date().getFullYear()} {BRAND.name}. Built in Gwalior.</p>

    <p className="flex items-center gap-2">
      Secure payments by <span className="font-semibold text-ivory">Razorpay</span>
    </p>
  </div>

  <div className="text-center border-t border-line pt-3">
    <p className="font-semibold text-ivory">ONET VISION</p>
    <p className="text-xs text-muted">
      Legal Entity • www.onet.co.in
    </p>
  </div>
</div>
      </div>
    </footer>
  );
}
