'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ArrowRight } from 'lucide-react';

/* A decorative rakhi drawn with pure SVG (no image needed) — thread + flower + gem */
function Rakhi({ size = 44, hue = '#FFD86B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* threads */}
      <path d="M6 62 C 26 50, 30 54, 40 52" stroke="#E23E7A" strokeWidth="5" strokeLinecap="round" />
      <path d="M94 38 C 74 50, 70 46, 60 48" stroke="#E23E7A" strokeWidth="5" strokeLinecap="round" />
      <path d="M10 74 C 28 66, 32 60, 42 58" stroke="#B0306B" strokeWidth="4" strokeLinecap="round" />
      <path d="M90 26 C 72 34, 68 40, 58 42" stroke="#B0306B" strokeWidth="4" strokeLinecap="round" />
      {/* petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="50" cy="26" rx="8" ry="15" fill={hue}
          transform={`rotate(${i * 45} 50 50)`} opacity="0.95" />
      ))}
      {/* center */}
      <circle cx="50" cy="50" r="16" fill="#8A1E5C" />
      <circle cx="50" cy="50" r="10" fill="#E23E7A" />
      <circle cx="50" cy="50" r="4.5" fill="#FFF3C4" />
    </svg>
  );
}

/* Floating rakhi with a gentle drift + rotate loop */
function Floaty({ x, delay, size, hue, dur = 6, drift = 14 }) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: x, top: '50%' }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.9, 0.9, 0], y: [-drift, drift, -drift], rotate: [0, 360] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Rakhi size={size} hue={hue} />
    </motion.div>
  );
}

export default function RakhiBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] shadow-pop"
      >
        {/* premium festive gradient base */}
        <div className="relative bg-gradient-to-br from-[#C2185B] via-[#8A1E5C] to-[#2E0A24] px-6 py-12 sm:px-14 sm:py-16 text-white">
          {/* glow orbs */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#FFD86B]/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-fashionpink/30 blur-3xl" aria-hidden />
          {/* subtle sparkle dots */}
          {[['12%', '20%'], ['82%', '30%'], ['70%', '78%'], ['25%', '80%'], ['46%', '14%']].map(([l, t], i) => (
            <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-white/70"
              style={{ left: l, top: t }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2.2, delay: i * 0.4, repeat: Infinity }} />
          ))}

          {/* floating rakhis — idhar udhar */}
          <Floaty x="4%"  delay={0}   size={54} hue="#FFD86B" dur={7} drift={16} />
          <Floaty x="16%" delay={1.2} size={34} hue="#FF9FC4" dur={6} drift={12} />
          <Floaty x="86%" delay={0.6} size={50} hue="#FFD86B" dur={7.5} drift={18} />
          <Floaty x="74%" delay={1.8} size={30} hue="#FF9FC4" dur={5.5} drift={10} />
          <Floaty x="92%" delay={2.4} size={26} hue="#FFE9A8" dur={6.5} drift={14} />

          {/* content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles size={15} className="fill-white" /> This Raksha Bandhan, from OneT ❤️
            </motion.span>

            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight">
              Rakhi is <span className="text-[#FFD86B]">FREE</span> for everyone <span className="inline-block">🪢</span>
            </h2>
            <p className="mt-3 text-white/85 text-sm sm:text-lg">
              Order anything this Raksha Bandhan and get a beautiful rakhi absolutely free —
              our little gift to celebrate the bond you cherish.
            </p>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-6 inline-block">
              <Link href="/products?category=rakhi"
                className="inline-flex items-center gap-2 rounded-full bg-white text-plum px-7 py-3.5 text-sm sm:text-base font-bold shadow-soft hover:bg-[#FFF6E0] transition">
                <Gift size={18} /> Claim your free rakhi <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* golden bottom shimmer line */}
        <div className="h-1.5 bg-gradient-to-r from-[#FFD86B] via-fashionpink to-[#FFD86B]" />
      </motion.div>
    </section>
  );
}