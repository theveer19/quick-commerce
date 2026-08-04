'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { fetchProducts } from '@/lib/data';

export default function ProductRail({ title, eyebrow, category, search, limit = 12, href = '/products' }) {
  const [items, setItems] = useState(null);
  const scroller = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchProducts({ category, search }).then((rows) => { if (alive) setItems(rows.slice(0, limit)); }).catch(() => setItems([]));
    return () => { alive = false; };
  }, [category, search, limit]);

  const scroll = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  };

  if (items && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-grape">{eyebrow}</span>}
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ivory leading-none">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-plum hover:text-grape">
            See all <ArrowUpRight size={15} />
          </Link>
          <div className="hidden md:flex gap-1.5">
            <button onClick={() => scroll(-1)} aria-label="Scroll left" className="grid place-items-center w-9 h-9 rounded-full bg-white border border-line shadow-soft text-plum hover:bg-lilacbg transition"><ChevronLeft size={18} /></button>
            <button onClick={() => scroll(1)} aria-label="Scroll right" className="grid place-items-center w-9 h-9 rounded-full bg-white border border-line shadow-soft text-plum hover:bg-lilacbg transition"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <div ref={scroller} className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {!items
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 sm:w-48 shrink-0 animate-pulse">
                <div className="aspect-[3/4] rounded-xl2 bg-white border border-line" />
                <div className="mt-3 h-4 w-2/3 bg-white rounded" />
              </div>
            ))
          : items.map((p, i) => (
              <div key={p.id} className="w-40 sm:w-48 shrink-0 snap-start">
                <ProductCard p={p} index={i} />
              </div>
            ))}
      </div>
    </section>
  );
}
