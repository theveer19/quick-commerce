'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, Truck, RefreshCw, Check } from 'lucide-react';
import { fetchProduct } from '@/lib/data';
import { useCart } from '@/lib/cart';
import { inr, cx } from '@/lib/format';
import { BRAND } from '@/lib/config';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [p, setP] = useState(undefined);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct(id).then((prod) => {
      setP(prod);
      if (prod?.sizes?.length) setSize(prod.sizes[0]);
      if (prod?.colors?.length) setColor((prod.colors[0].name) || prod.colors[0]);
    });
  }, [id]);

  if (p === undefined) return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading…</div>;
  if (p === null) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="font-display text-2xl text-ivory">Product not found.</p>
      <button onClick={() => router.push('/products')} className="mt-4 text-rose hover:underline">Back to products</button>
    </div>
  );

  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

  const onAdd = () => {
    add(p, size, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="text-sm text-muted mb-4">Home / Products / {p.name}</div>
      <div className="grid gap-10 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
          {off > 0 && <span className="absolute top-4 left-4 bg-rose text-white text-sm font-bold px-3 py-1 rounded-full">{off}% OFF</span>}
        </motion.div>

        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Star size={14} className="fill-mint text-mint" /> {p.rating || '—'} · {p.stock > 0 ? `${p.stock} in stock` : 'Sold out'}
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-ivory">{p.name}</h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-3xl font-bold text-ivory">{inr(p.price)}</span>
            {off > 0 && <span className="text-lg text-muted line-through">{inr(p.mrp)}</span>}
            {off > 0 && <span className="text-mint text-sm font-semibold">Save {inr(p.mrp - p.price)}</span>}
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

          <p className="mt-6 text-muted leading-relaxed">{p.description}</p>

          {p.colors?.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-ivory mb-2">Color{color ? <span className="text-muted font-normal"> · {color}</span> : ''}</div>
              <div className="flex flex-wrap gap-2.5">
                {p.colors.map((c) => {
                  const nm = c.name || c; const hx = c.hex || '#ccc';
                  return (
                    <button key={nm} onClick={() => setColor(nm)} title={nm}
                      className={cx('w-9 h-9 rounded-full border-2 transition-all grid place-items-center',
                        color === nm ? 'border-rose scale-110' : 'border-line hover:border-violet')}>
                      <span className="w-6 h-6 rounded-full" style={{ backgroundColor: hx }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {p.sizes?.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-ivory mb-2">Select size</div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={cx('min-w-[3rem] rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                      size === s ? 'border-rose bg-rose/10 text-rose' : 'border-line text-muted hover:text-ivory')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button onClick={onAdd} disabled={p.stock === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose text-white px-6 py-4 font-semibold shadow-glow hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40">
              {added ? <><Check size={18} /> Added</> : p.stock === 0 ? 'Sold out' : 'Add to bag'}
            </button>
            <button onClick={() => { add(p, size, color); router.push('/cart'); }} disabled={p.stock === 0}
              className="rounded-full border border-line px-6 py-4 font-semibold text-ivory hover:border-violet transition-all disabled:opacity-40">
              Buy now
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[[Truck, `~${BRAND.etaMinutes} min delivery`], [RefreshCw, 'Try before you pay'], [ShieldCheck, 'Secure payment']].map(([Icon, label]) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-3 text-center">
                <Icon size={18} className="mx-auto text-rose" />
                <div className="mt-2 text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
