'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ArrowRight } from 'lucide-react';

/* A peacock feather (mor-pankh) drawn with pure SVG — Krishna / Janmashtami motif */
function Feather({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* stem */}
      <path d="M50 96 C 49 74, 50 62, 50 46" stroke="#0E8F6E" strokeWidth="4" strokeLinecap="round" />
      {/* soft barbs down the stem */}
      {Array.from({ length: 9 }).map((_, i) => {
        const t = i / 8;
        const y = 50 + t * 38;
        const w = 9 - t * 5;
        return (
          <g key={i} opacity="0.65">
            <path d={`M50 ${y} C ${50 - w - 6} ${y - 2}, ${50 - w - 8} ${y + 6}, ${50 - w} ${y + 9}`} stroke="#14B39A" strokeWidth="1.3" />
            <path d={`M50 ${y} C ${50 + w + 6} ${y - 2}, ${50 + w + 8} ${y + 6}, ${50 + w} ${y + 9}`} stroke="#14B39A" strokeWidth="1.3" />
          </g>
        );
      })}
      {/* the eye */}
      <ellipse cx="50" cy="30" rx="17" ry="24" fill="#E9B44C" />
      <ellipse cx="50" cy="32" rx="12" ry="18" fill="#1E9E77" />
      <ellipse cx="50" cy="34" rx="8" ry="12" fill="#1E5FBF" />
      <ellipse cx="50" cy="35" rx="4" ry="7" fill="#0B2A6B" />
    </svg>
  );
}

/* Floating feather with a gentle drift + sway loop */
function Floaty({ x, delay, size, dur = 6, drift = 14 }) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: x, top: '50%' }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.9, 0.9, 0], y: [-drift, drift, -drift], rotate: [-14, 14, -14] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Feather size={size} />
    </motion.div>
  );
}

export default function JanmashtamiBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] shadow-pop"
      >
        {/* Krishna night-sky gradient */}
        <div className="relative bg-gradient-to-br from-[#1E1065] via-[#4C1D95] to-[#2A0E4E] px-6 py-12 sm:px-14 sm:py-16 text-white">
          {/* glow orbs */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#FFD86B]/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-[#8A5CF0]/40 blur-3xl" aria-hidden />

          {/* golden sparkle dots */}
          {[['12%', '20%'], ['82%', '30%'], ['70%', '78%'], ['25%', '80%'], ['46%', '14%']].map(([l, t], i) => (
            <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-[#FFE7A6]"
              style={{ left: l, top: t }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2.2, delay: i * 0.4, repeat: Infinity }} />
          ))}

          {/* floating peacock feathers */}
          <Floaty x="4%"  delay={0}   size={54} dur={7}   drift={16} />
          <Floaty x="16%" delay={1.2} size={34} dur={6}   drift={12} />
          <Floaty x="86%" delay={0.6} size={50} dur={7.5} drift={18} />
          <Floaty x="74%" delay={1.8} size={30} dur={5.5} drift={10} />

          {/* content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles size={15} className="fill-white" /> 🦚 This Janmashtami, from OneT ❤️
            </motion.span>

            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight">
              Happy <span className="text-[#FFD86B]">Janmashtami</span> — जय श्री कृष्ण
            </h2>
            <p className="mt-3 text-white/85 text-sm sm:text-lg">
              Celebrate Kanha’s birthday with up to <b className="text-[#FFD86B]">60% OFF</b> festive styles —
              use code <b>KANHA</b> at checkout.
            </p>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-6 inline-block">
              <Link href="/offers"
                className="inline-flex items-center gap-2 rounded-full bg-white text-plum px-7 py-3.5 text-sm sm:text-base font-bold shadow-soft hover:bg-[#FFF6E0] transition">
                <Gift size={18} /> Shop the festive sale <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* golden bottom shimmer line */}
        <div className="h-1.5 bg-gradient-to-r from-[#FFD86B] via-[#8A5CF0] to-[#FFD86B]" />
      </motion.div>
    </section>
  );
}
