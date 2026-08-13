'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, Plus } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/format';

export default function WishlistPage() {
  const remove = useWishlist((s) => s.remove);
  const hydrate = useWishlist((s) => s.hydrate);
  const ids = useWishlist((s) => s.ids);
  const add = useCart((s) => s.add);
  const [items, setItems] = useState([]);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { setItems(useWishlist.getState().items()); }, [ids]);

  if (items.length === 0) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="grid place-items-center w-16 h-16 rounded-2xl bg-lilacbg text-fashionpink mx-auto"><Heart size={28} /></div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ivory">Your wishlist is empty</h1>
      <p className="mt-2 text-muted">Tap the heart on any product to save it here.</p>
      <Link href="/products" className="mt-6 inline-flex rounded-full bg-rose text-white px-7 py-3.5 font-semibold shadow-glow">Browse products</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ivory mb-6">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl2 border border-line bg-surface overflow-hidden shadow-soft">
            <Link href={`/product/${p.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name} className="aspect-[3/4] w-full object-cover" />
            </Link>
            <div className="p-3">
              <p className="text-sm font-medium text-ivory truncate">{p.name}</p>
              <p className="font-display font-bold text-ivory mt-1">{inr(p.price)}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => add(p, p.sizes?.[0])} className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-rose text-white text-xs font-semibold py-2"><Plus size={13} /> Add</button>
                <button onClick={() => remove(p.id)} className="grid place-items-center w-8 h-8 rounded-full border border-line text-muted hover:text-rose"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}