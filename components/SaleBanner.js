'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// next 15 August
function nextIndependenceDay() {
  const now = new Date();
  let year = now.getFullYear();
  let d = new Date(year, 7, 15, 23, 59, 59); // Aug = 7
  if (d < now) d = new Date(year + 1, 7, 15, 23, 59, 59);
  return d;
}

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - new Date());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

const Box = ({ v, l }) => (
  <div className="text-center">
    <div className="w-12 sm:w-14 rounded-xl bg-white/15 backdrop-blur py-2 font-display text-2xl sm:text-3xl font-bold tabular-nums">
      {String(v).padStart(2, '0')}
    </div>
    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/80">{l}</div>
  </div>
);

export default function SaleBanner() {
  const [target] = useState(nextIndependenceDay);
  const { d, h, m, s } = useCountdown(target);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 pb-2">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="relative overflow-hidden rounded-xl3 shadow-pop">
        {/* tricolor top strip */}
        <div className="absolute inset-x-0 top-0 h-1.5 flex">
          <div className="flex-1 bg-saffron" /><div className="flex-1 bg-white" /><div className="flex-1 bg-indiagreen" />
        </div>
        {/* purple base with festive glow */}
        <div className="bg-gradient-to-br from-grape via-plum to-[#2A1256] text-white px-6 py-8 md:px-12 md:py-10">
          <div className="absolute -right-10 -top-6 w-56 h-56 rounded-full bg-saffron/25 blur-3xl" aria-hidden />
          <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full bg-indiagreen/25 blur-3xl" aria-hidden />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
                🇮🇳 INDEPENDENCE DAY SALE
              </span>
              <h2 className="mt-3 font-display text-3xl md:text-5xl font-extrabold leading-tight">
                Up to <span className="text-saffron">60% OFF</span> the freedom edit
              </h2>
              <p className="mt-2 text-white/80 max-w-md">
                Celebrate in style. Extra flat ₹150 off with code <span className="font-semibold text-white">FREEDOM</span> on your first order.
              </p>
              <Link href="/products" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-plum px-6 py-3 font-semibold hover:bg-white/90 transition">
                Shop the sale <ArrowRight size={18} />
              </Link>
            </div>

            <div className="shrink-0">
              <p className="text-xs uppercase tracking-wider text-white/70 mb-2 text-center md:text-left">Sale ends in</p>
              <div className="flex gap-2 sm:gap-3">
                <Box v={d} l="Days" /><Box v={h} l="Hrs" /><Box v={m} l="Min" /><Box v={s} l="Sec" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
