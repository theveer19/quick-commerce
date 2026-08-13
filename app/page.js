'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BadgePercent, Truck, Gift, RefreshCcw, Zap, PackageCheck, ShieldCheck } from 'lucide-react';
import Hero from '@/components/Hero';
import SaleBanner from '@/components/SaleBanner';
import ProductRail from '@/components/ProductRail';
import Reveal from '@/components/Reveal';
import { BRAND } from '@/lib/config';

function StoreSwitcher({ store, setStore }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'onet', label: 'OneT India', tag: 'Fashion', grad: 'from-plum via-rose to-violet' },
          { key: 'rakhi', label: 'Rakhi Store', tag: 'Festive picks', grad: 'from-[#C0182B] to-[#6E0C18]' },
        ].map((s) => {
          const active = store === s.key;
          return (
            <button key={s.key} onClick={() => setStore(s.key)}
              className={`relative overflow-hidden rounded-2xl px-5 py-4 text-left border transition-all ${active ? `bg-gradient-to-br ${s.grad} text-white border-transparent shadow-glow` : 'bg-white text-ivory border-line hover:border-violet'}`}>
              <span className={`font-display text-xl font-extrabold ${s.key === 'rakhi' ? 'italic' : ''}`}>{s.label}</span>
              <span className={`block text-xs mt-0.5 ${active ? 'text-white/80' : 'text-muted'}`}>{s.tag}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}





const steps = [
  { icon: Zap, title: 'Order in a tap', desc: 'Add today’s drops to your bag.' },
  { icon: Truck, title: `~${BRAND.etaMinutes} min delivery`, desc: `Rider reaches you fast in ${BRAND.city}.` },
  { icon: PackageCheck, title: 'Try at your door', desc: 'Keep what fits, return the rest.' },
  { icon: ShieldCheck, title: 'Pay for keeps', desc: 'UPI, card or cash — only for keeps.' },
];

export default function HomePage() {
  const [store, setStore] = useState('onet');
  return (
    <>
      <Hero />

      <StoreSwitcher store={store} setStore={setStore} />

      {store === 'rakhi' ? (
        <>
          {/* ── RAKHI STORE ── */}
          <ProductRail eyebrow="Rakhi Store" title="Rakhis for your sibling" category="rakhi" href="/products?category=rakhi" limit={12} />
          <ProductRail eyebrow="Combos" title="Rakhi gift combos" category="rakhi" href="/products?category=rakhi" limit={12} />
        </>
      ) : (
        <>
          {/* ── PRODUCT RAILS ── */}
          <ProductRail eyebrow="Selling fast" title={`Trending in ${BRAND.city}`} limit={12} />
          <ProductRail eyebrow="Just in" title="New arrivals" category="women" href="/products?category=women" limit={12} />

          {/* ── SALE ── */}
          <SaleBanner />

          <ProductRail eyebrow="Steal deals" title="Under ₹999" href="/products" limit={12} />
        </>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="rounded-[1.75rem] bg-white border border-line shadow-soft px-6 py-10 sm:px-12">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-grape">Try &amp; Buy</span>
            <h2 className="mt-2 font-display text-2xl md:text-4xl font-extrabold tracking-tight text-ivory text-balance">{BRAND.city}’s try-then-buy fashion delivery</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="flex sm:flex-col items-center sm:items-start gap-3 text-center sm:text-left">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-lilacbg text-grape shrink-0"><s.icon size={20} /></span>
                  <div>
                    <h3 className="font-display font-bold text-ivory">{s.title}</h3>
                    <p className="text-sm text-muted mt-0.5">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape via-plum to-[#241049] px-6 py-14 sm:px-16 sm:py-16 text-center">
          <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-rose/30 blur-3xl" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 text-white px-3 py-1 text-xs font-semibold"><Zap size={13} className="fill-white" /> ~{BRAND.etaMinutes} min delivery</span>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white text-balance">Your next outfit is minutes away.</h2>
            <p className="mt-3 text-white/80 max-w-md mx-auto">Free delivery over ₹{BRAND.freeDeliveryAbove}. Contactless & try-before-you-pay.</p>
            <Link href="/products" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-plum px-8 py-4 font-semibold hover:bg-white/90 transition-colors">
              Start shopping <ArrowRight size={17} />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}