'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Sparkles } from 'lucide-react';

// Raksha Bandhan sale ends — set your end date here (year, monthIndex 0-11, day)
const SALE_END = new Date(2026, 7, 9, 23, 59, 59); // 9 Aug 2026 (change as needed)

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, over: false });
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, over: true }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setT({ d, h, m, s, over: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function Unit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[46px] rounded-lg bg-white/15 backdrop-blur px-2.5 py-1.5 text-center">
        <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wide text-white/70">{label}</span>
    </div>
  );
}

export default function SaleBanner() {
  const { d, h, m, s, over } = useCountdown(SALE_END);
  if (over) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-gradient-to-br from-[#B0306B] via-[#8A1E5C] to-[#4A0E3A] shadow-card">
      {/* soft glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fashionpink/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#F6C64B]/20 blur-2xl" aria-hidden />

      <div className="relative grid gap-5 px-6 py-7 sm:px-10 sm:py-9 md:grid-cols-2 md:items-center">
        <div className="text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Sparkles size={13} className="fill-white" /> Raksha Bandhan Special
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-tight">
            Rakhi is <span className="text-[#FFD86B]">100% FREE</span><br />this Raksha Bandhan 🪢
          </h2>
          <p className="mt-2 text-sm text-white/85">
            Free rakhi with every order + up to <b>50% OFF</b> festive styles. Use code <b>RAKHI</b>.
          </p>
          <Link href="/offers"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-plum px-5 py-2.5 text-sm font-bold shadow-soft hover:bg-white/90 transition">
            <Gift size={16} /> Celebrate the sale
          </Link>
        </div>

        <div className="md:justify-self-end">
          <p className="mb-2 text-xs uppercase tracking-wide text-white/70">Sale ends in</p>
          <div className="flex items-center gap-2 sm:gap-3">
            <Unit value={d} label="Days" />
            <span className="pb-4 text-xl text-white/50">:</span>
            <Unit value={h} label="Hrs" />
            <span className="pb-4 text-xl text-white/50">:</span>
            <Unit value={m} label="Min" />
            <span className="pb-4 text-xl text-white/50">:</span>
            <Unit value={s} label="Sec" />
          </div>
        </div>
      </div>
    </div>
  );
}