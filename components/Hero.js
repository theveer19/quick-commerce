'use client';
import Link from 'next/link';
import { ArrowRight, Zap, Truck, Gift, RefreshCcw } from 'lucide-react';
import Carousel from './Carousel';
import { BRAND } from '@/lib/config';

const SLIDES = [
  {
    grad: 'from-grape via-plum to-[#1E0A44]',
    eyebrow: `Delivered in ~${BRAND.etaMinutes} min`, badge: 'zap',
    title: 'Fashion you love,\ndelivered in minutes',
    sub: 'Today’s drops at your door before your chai gets cold.',
    cta: 'Shop new drops', href: '/products',
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  },
  {
    grad: 'from-grape to-plum',
    eyebrow: 'Free delivery',
    title: '₹0 delivery fees',
    sub: `On every order above ₹${BRAND.freeDeliveryAbove}. No hidden charges.`,
    cta: 'Shop now', href: '/products',
    img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80',
  },
  {
    grad: 'from-[#7A1FA2] via-grape to-plum',
    eyebrow: '🇮🇳 Independence Day Sale',
    title: 'Up to 60% OFF\nthe Freedom Edit',
    sub: 'Extra ₹150 off your first order with code FREEDOM.',
    cta: 'Grab the sale', href: '/products',
    img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  },
  {
    grad: 'from-[#0EA5A0] to-indiagreen',
    eyebrow: 'New customer offer',
    title: '₹150 OFF\nyour first order',
    sub: 'Use code FREEDOM at checkout. Limited time.',
    cta: 'Claim offer', href: '/products',
    img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
  },
  {
    grad: 'from-[#C2185B] via-fashionpink to-plum',
    eyebrow: 'Try & Buy',
    title: 'Try it on first.\nPay for keeps only.',
    sub: 'Keep what fits, hand back the rest — right at your door.',
    cta: 'How it works', href: '/products',
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  },
  {
    grad: 'from-plum to-grape',
    eyebrow: 'Zero worries',
    title: 'Free returns\nat your doorstep',
    sub: 'Didn’t love it? Hand it back on the spot — no charges.',
    cta: 'Start shopping', href: '/products',
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-5">
      <Carousel autoPlay={3000} pauseOnHover={false} rounded="rounded-2xl sm:rounded-[1.75rem]" className="shadow-card">
        {SLIDES.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`relative bg-gradient-to-br ${s.grad} min-h-[240px] sm:min-h-[320px]`}>
              <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative grid sm:grid-cols-2 items-center gap-4 px-6 py-8 sm:px-12 sm:py-12">
                <div className="text-white">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    {s.badge === 'zap' && <Zap size={13} className="fill-white" />}{s.eyebrow}
                  </span>
                  <h2 className="mt-3 font-display text-3xl sm:text-5xl font-extrabold leading-[1.02] whitespace-pre-line tracking-tight">{s.title}</h2>
                  <p className="mt-3 text-white/80 max-w-sm">{s.sub}</p>
                  <Link href={s.href} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white text-plum px-6 py-3 font-semibold hover:bg-white/90 transition-colors">
                    {s.cta} <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="hidden sm:block relative h-full min-h-[220px]">
                  {s.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover rounded-2xl border border-white/30" />
                  ) : Icon ? (
                    <div className="absolute inset-0 grid place-items-center"><Icon className="text-white/20" size={150} strokeWidth={1.4} /></div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>
    </section>
  );
}