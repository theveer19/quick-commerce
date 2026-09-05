'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ArrowRight } from 'lucide-react';

/* A modak (Ganesh's favourite sweet) drawn with pure SVG */
function Modak({ size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <path d="M50 8 C 41 30, 31 40, 27 58 C 24 76, 37 88, 50 88 C 63 88, 76 76, 73 58 C 69 40, 59 30, 50 8 Z" fill="#F3C75E" />
      {/* pleats */}
      <path d="M50 12 L50 84" stroke="#C9962F" strokeWidth="2" opacity="0.55" />
      <path d="M38 30 C 34 48, 34 66, 40 84" stroke="#C9962F" strokeWidth="1.6" opacity="0.4" />
      <path d="M62 30 C 66 48, 66 66, 60 84" stroke="#C9962F" strokeWidth="1.6" opacity="0.4" />
      {/* base */}
      <rect x="34" y="84" width="32" height="7" rx="3.5" fill="#B77B24" />
      {/* tip */}
      <circle cx="50" cy="9" r="4" fill="#B3122B" />
    </svg>
  );
}

/* Floating motif with a gentle drift + sway */
function Floaty({ x, delay, size, dur = 6, drift = 14 }) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: x, top: '50%' }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.9, 0.9, 0], y: [-drift, drift, -drift], rotate: [-10, 10, -10] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Modak size={size} />
    </motion.div>
  );
}

export default function GaneshChaturthiBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2rem] shadow-pop"
      >
        {/* festive saffron gradient */}
        <div className="relative bg-gradient-to-br from-[#B3122B] via-[#E4572E] to-[#FF9F1C] px-6 py-12 sm:px-14 sm:py-16 text-white">
          {/* glow orbs */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#FFD86B]/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-[#FF7A00]/40 blur-3xl" aria-hidden />

          {/* marigold garland (toran) across the top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around px-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="mt-0 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: i % 2 ? '#FFC21C' : '#FF7A00' }} />
            ))}
          </div>

          {/* golden sparkle dots */}
          {[['14%', '24%'], ['82%', '30%'], ['70%', '78%'], ['26%', '80%'], ['48%', '18%']].map(([l, t], i) => (
            <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full bg-[#FFF0C2]"
              style={{ left: l, top: t }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2.2, delay: i * 0.4, repeat: Infinity }} />
          ))}

          {/* floating modaks */}
          <Floaty x="5%"  delay={0}   size={50} dur={7}   drift={16} />
          <Floaty x="17%" delay={1.2} size={32} dur={6}   drift={12} />
          <Floaty x="85%" delay={0.6} size={48} dur={7.5} drift={18} />
          <Floaty x="74%" delay={1.8} size={30} dur={5.5} drift={10} />

          {/* content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles size={15} className="fill-white" /> 🙏 गणपति बप्पा मोरया — from OneT ❤️
            </motion.span>

            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold leading-tight">
              Happy <span className="text-[#FFE08A]">Ganesh Chaturthi</span>
            </h2>
            <p className="mt-3 text-white/90 text-sm sm:text-lg">
              Celebrate with up to <b className="text-[#FFE08A]">60% OFF</b> festive styles —
              use code <b>GANESH</b> at checkout.
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
        <div className="h-1.5 bg-gradient-to-r from-[#FFD86B] via-[#FF7A00] to-[#FFD86B]" />
      </motion.div>
    </section>
  );
}
