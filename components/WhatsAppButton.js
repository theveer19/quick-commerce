'use client';
// Floating "Chat with us" WhatsApp button. Opens WhatsApp with a ready
// message (and the product name when on a product page).
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '@/lib/config';
import { cx } from '@/lib/format';

const HIDE_ON = ['/admin', '/checkout', '/pay', '/invoice'];
// pages with their own sticky bar at the bottom on phones
const RAISE_ON = ['/product/', '/cart'];

function WaIcon({ size = 26 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M16.04 3C8.86 3 3.03 8.82 3.03 15.99c0 2.3.6 4.54 1.75 6.52L3 29l6.66-1.74a13 13 0 0 0 6.37 1.66h.01c7.17 0 13-5.83 13-13S23.21 3 16.04 3Zm0 23.73h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.24-3.95 1.03 1.05-3.85-.26-.4a10.77 10.77 0 0 1-1.66-5.78c0-5.96 4.85-10.81 10.82-10.81a10.8 10.8 0 0 1 10.8 10.82c0 5.97-4.85 10.73-10.89 10.73Zm5.93-8.1c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.86-1.62-1.93-1.81-2.25-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.71s1.17 3.14 1.33 3.36c.16.22 2.3 3.5 5.56 4.91.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.14-.3-.22-.62-.38Z" />
    </svg>
  );
}

export default function WhatsAppButton() {
  const pathname = usePathname() || '/';
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200);
    // a one-time "Need help?" bubble per visit
    let seen = false;
    try { seen = sessionStorage.getItem('onet_wa_hint') === '1'; } catch {}
    const h = seen ? null : setTimeout(() => { setHint(true); try { sessionStorage.setItem('onet_wa_hint', '1'); } catch {} }, 9000);
    const h2 = seen ? null : setTimeout(() => setHint(false), 17000);
    return () => { clearTimeout(t); if (h) clearTimeout(h); if (h2) clearTimeout(h2); };
  }, []);

  if (!BRAND.whatsapp || HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const raise = RAISE_ON.some((p) => pathname.startsWith(p));
  const title = typeof document !== 'undefined' && pathname.startsWith('/product/') ? document.title.split(' · ')[0] : '';
  const text = title
    ? `Hi OneT India! I have a question about "${title}".`
    : 'Hi OneT India! I need help with my order.';
  const href = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }}
          className={cx('fixed right-4 z-[90] flex items-center gap-3 md:bottom-6 md:right-6', raise ? 'bottom-[92px]' : 'bottom-5')}
        >
          <AnimatePresence>
            {hint && (
              <motion.button
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onClick={() => setHint(false)}
                className="hidden rounded-2xl bg-white px-3.5 py-2.5 text-left text-[13px] leading-snug text-ivory shadow-pop ring-1 ring-black/5 sm:block"
              >
                <b className="block">Need help choosing?</b>
                <span className="text-muted">Chat with us on WhatsApp</span>
              </motion.button>
            )}
          </AnimatePresence>
          <a
            href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with OneT India on WhatsApp"
            className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.65)] transition-transform hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" aria-hidden />
            <WaIcon />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
