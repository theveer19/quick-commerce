'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Bell, Shirt } from 'lucide-react';
import PlayBadge from './PlayBadge';
import { APP_OFFER } from '@/lib/config';

// "Get the app" card shown a few seconds after someone opens the website.
// Shown once and then quiet for a week after it is closed, never on the admin
// or payment pages, and not on iPhones (the app is Android-only for now).
const KEY = 'onet_app_promo_closed';
const QUIET_DAYS = 7;
const MAROON = '#8C1C13';

export default function AppPromo() {
  const pathname = usePathname() || '';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/pay') || pathname.startsWith('/checkout')) return undefined;
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return undefined;
    // Already inside the Android app's webview / installed PWA? Skip.
    if (/; wv\)/.test(ua) || window.matchMedia?.('(display-mode: standalone)').matches) return undefined;
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (at && Date.now() - at < QUIET_DAYS * 864e5) return undefined;
    } catch { /* storage blocked — just show it */ }
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, [pathname]);

  const close = () => {
    setShow(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed z-[250] left-3 right-3 bottom-3 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[380px]"
          role="dialog"
          aria-label="Get the OneT India app"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(40,10,10,0.25)] border border-line">
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${MAROON}, #E4890C)` }} />
            <button onClick={close} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-lilacbg hover:text-ivory">
              <X size={17} />
            </button>
            <div className="p-4 pr-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-white font-display text-xl font-extrabold" style={{ background: `linear-gradient(135deg, ${MAROON}, #5E120C)` }}>
                  O
                </div>
                <div>
                  <p className="font-display text-[17px] font-extrabold text-ivory leading-tight">OneT India app is here</p>
                  <p className="text-xs text-muted mt-0.5">Now on Google Play · Free</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2.5" style={{ borderColor: `${MAROON}55`, backgroundColor: `${MAROON}0A` }}>
                <span className="font-display text-xl font-extrabold leading-none" style={{ color: MAROON }}>₹{APP_OFFER.amount}<span className="block text-[10px] font-bold tracking-wider">OFF</span></span>
                <span className="text-[12.5px] leading-snug text-ivory">
                  On your <b>first app order</b> above ₹{APP_OFFER.min}. Use code{' '}
                  <b className="rounded bg-white px-1.5 py-0.5 tracking-wider ring-1 ring-black/10">{APP_OFFER.code}</b>
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[13px] text-ivory">
                <li className="flex items-center gap-2"><Zap size={14} style={{ color: MAROON }} /> Order in 2 taps, delivered in minutes</li>
                <li className="flex items-center gap-2"><Bell size={14} style={{ color: MAROON }} /> Live order updates & new-drop alerts</li>
                <li className="flex items-center gap-2"><Shirt size={14} style={{ color: MAROON }} /> Try first, pay only for what you keep</li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <PlayBadge onClick={close} />
                <button onClick={close} className="text-xs font-semibold text-muted hover:text-ivory">Not now</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
