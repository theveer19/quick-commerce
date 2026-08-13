'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { inr } from '@/lib/format';

export default function ProductCard({ p, index = 0 }) {
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const hydrate = useWishlist((s) => s.hydrate);
  const ids = useWishlist((s) => s.ids);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { hydrate(); setMounted(true); }, [hydrate]);
  const wished = mounted && ids.includes(p.id);

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
      <div className="relative">
        <Link href={`/product/${p.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl2 bg-surface border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {off > 0 && <span className="absolute top-3 left-3 bg-rose text-white text-[11px] font-bold px-2 py-1 rounded-full">{off}% OFF</span>}
            {p.stock === 0 && (
              <div className="absolute inset-0 bg-ivory/45 backdrop-blur-[1px] grid place-items-center">
                <span className="text-sm font-semibold text-white">Sold out</span>
              </div>
            )}
            {low && <span className="absolute bottom-3 left-3 bg-white/90 text-rose shadow-soft text-[11px] font-semibold px-2 py-1 rounded-full">Only {p.stock} left</span>}
          </div>
        </Link>

        {/* wishlist heart */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(p); }}
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-soft hover:scale-110 active:scale-90 transition-transform"
        >
          <Heart size={17} className={wished ? 'fill-fashionpink text-fashionpink' : 'text-muted'} />
        </button>
      </div>

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