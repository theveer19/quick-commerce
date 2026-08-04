'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/format';
import { BRAND } from '@/lib/config';

export default function CartPage() {
  const { items, inc, dec, remove, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="mx-auto max-w-6xl px-4 py-20 text-muted">Loading…</div>;

  const sub = subtotal();
  const delivery = sub === 0 || sub >= BRAND.freeDeliveryAbove ? 0 : BRAND.deliveryFee;
  const total = sub + delivery;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-surface border border-line">
          <ShoppingBag className="text-muted" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ivory">Your bag is empty</h1>
        <p className="mt-2 text-muted">Add a few styles and get them delivered in minutes.</p>
        <Link href="/products" className="mt-6 inline-flex rounded-full bg-rose text-white px-7 py-3.5 font-semibold shadow-glow">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ivory mb-8">Your bag ({items.length})</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <motion.div key={i.key} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="flex gap-4 rounded-xl2 border border-line bg-surface p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt={i.name} className="w-20 h-24 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-ivory truncate">{i.name}</h3>
                      {(i.size || i.color) && <p className="text-xs text-muted mt-0.5">{[i.size && `Size: ${i.size}`, i.color].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <button onClick={() => remove(i.key)} aria-label="Remove" className="text-muted hover:text-rose"><Trash2 size={18} /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full border border-line px-1 py-1">
                      <button onClick={() => dec(i.key)} className="grid place-items-center w-7 h-7 rounded-full hover:bg-lilacbg" aria-label="Decrease"><Minus size={14} /></button>
                      <span className="w-5 text-center text-sm font-medium">{i.qty}</span>
                      <button onClick={() => inc(i.key)} className="grid place-items-center w-7 h-7 rounded-full hover:bg-lilacbg" aria-label="Increase"><Plus size={14} /></button>
                    </div>
                    <span className="font-display font-bold text-ivory">{inr(i.price * i.qty)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-24 h-fit rounded-xl2 border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-ivory">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Subtotal" value={inr(sub)} />
            <Row label="Delivery" value={delivery === 0 ? 'Free' : inr(delivery)} accent={delivery === 0} />
            {delivery > 0 && <p className="text-xs text-muted">Add {inr(BRAND.freeDeliveryAbove - sub)} more for free delivery</p>}
            <div className="border-t border-line pt-3 flex justify-between font-display text-lg font-bold text-ivory">
              <span>Total</span><span>{inr(total)}</span>
            </div>
          </div>
          <Link href="/checkout" className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose text-white px-6 py-3.5 font-semibold shadow-glow hover:brightness-110 transition-all">
            Checkout <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-center text-xs text-muted">Try items at your door · Pay for keeps</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-mint font-medium' : 'text-ivory'}>{value}</span>
    </div>
  );
}
