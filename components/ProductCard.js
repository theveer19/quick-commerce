'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/format';

export default function ProductCard({ p, index = 0 }) {
  const add = useCart((s) => s.add);
  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const low = p.stock > 0 && p.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.04 }}
      className="group"
    >
      <Link href={`/product/${p.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 bg-surface border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image} alt={p.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {off > 0 && (
            <span className="absolute top-3 left-3 bg-rose text-white text-[11px] font-bold px-2 py-1 rounded-full">{off}% OFF</span>
          )}
          {p.stock === 0 && (
            <div className="absolute inset-0 bg-ivory/45 backdrop-blur-[1px] grid place-items-center">
              <span className="text-sm font-semibold text-muted">Sold out</span>
            </div>
          )}
          {low && <span className="absolute bottom-3 left-3 bg-white/90 text-rose shadow-soft text-[11px] font-semibold px-2 py-1 rounded-full">Only {p.stock} left</span>}
        </div>
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/product/${p.id}`}>
            <h3 className="text-sm font-medium text-ivory truncate">{p.name}</h3>
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display font-bold text-ivory">{inr(p.price)}</span>
            {off > 0 && <span className="text-xs text-muted line-through">{inr(p.mrp)}</span>}
          </div>
          {p.rating && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Star size={12} className="fill-mint text-mint" /> {p.rating}
            </div>
          )}
        </div>
        <button
          onClick={() => add(p, p.sizes?.[0])}
          disabled={p.stock === 0}
          aria-label={`Add ${p.name} to cart`}
          className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-lilacbg border border-line text-ivory hover:bg-rose hover:text-white hover:border-rose transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={16} />
        </button>
      </div>
    </motion.div>
  );
}
