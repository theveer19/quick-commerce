'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, Truck, RefreshCw, Check, ChevronLeft, ChevronRight, ArrowLeft, MapPin, Heart, Minus, Plus, Tag, Clock, BadgeCheck, Maximize2, X } from 'lucide-react';
import { fetchProduct } from '@/lib/data';
import { useCart } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { inr, cx } from '@/lib/format';
import { BRAND } from '@/lib/config';
import { fbTrack } from '@/lib/fbpixel';
import { outOfStock, maxQty } from '@/lib/stock';

const MAROON = '#8C1C13';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const toggleWish = useWishlist((s) => s.toggle);
  const hydrateWish = useWishlist((s) => s.hydrate);
  const wishIds = useWishlist((s) => s.ids);
  const [p, setP] = useState(undefined);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [canBack, setCanBack] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loc, setLoc] = useState(BRAND.city);

  useEffect(() => {
    setCanBack(typeof window !== 'undefined' && window.history.length > 1);
    hydrateWish();
    setMounted(true);
    try { const l = localStorage.getItem('onet_location'); if (l) setLoc(l); } catch {}
  }, [hydrateWish]);

  const goBack = () => { if (canBack) router.back(); else router.push('/products'); };

  useEffect(() => {
    fetchProduct(id).then((prod) => {
      setP(prod);
      if (prod?.sizes?.length) setSize(prod.sizes[0]);
      if (prod?.colors?.length) setColor((prod.colors[0].name) || prod.colors[0]);
      if (prod) fbTrack('ViewContent', { content_ids: [prod.id], content_name: prod.name, content_type: 'product', value: prod.price, currency: 'INR' });
    });
  }, [id]);

  if (p === undefined) return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading…</div>;
  if (p === null) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="font-display text-2xl text-ivory">Product not found.</p>
      <button onClick={() => router.push('/products')} className="mt-4 font-semibold hover:underline" style={{ color: MAROON }}>Back to products</button>
    </div>
  );

  const off = p.mrp && p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const out = outOfStock(p);
  const wished = mounted && wishIds.includes(p.id);

  const onAdd = () => {
    if (outOfStock(p)) return;
    for (let i = 0; i < qty; i++) add(p, size, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  const onBuy = () => { if (outOfStock(p)) return; for (let i = 0; i < qty; i++) add(p, size, color); router.push('/cart'); };

  const specs = [
    ['Category', p.category ? String(p.category).replace(/(^|\s)\S/g, (t) => t.toUpperCase()) : 'Fashion'],
    ['Colour', color || (p.colors?.[0]?.name || p.colors?.[0]) || '—'],
    ['Sizes', p.sizes?.length ? p.sizes.join(', ') : 'Free Size'],
    ['Delivery', `In minutes across ${BRAND.city} (${BRAND.workingHours})`],
    ['Returns', 'Try & Buy — pay only for what you keep'],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-10">
      <button onClick={goBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ivory transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="text-xs text-muted mb-4">Home / Products / <span className="text-ivory">{p.name}</span></div>

      <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
        <Gallery images={(p.images && p.images.length ? p.images : [p.image]).filter(Boolean)} name={p.name} off={off} />

        <div>
          {/* rating + stock pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1">
              <Star size={12} className="fill-emerald-600 text-emerald-600" /> {p.rating || '4.5'}
            </span>
            {out && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-red-600 bg-red-50">Out of stock</span>}
          </div>

          <h1 className="mt-2.5 font-display text-2xl md:text-3xl font-bold text-ivory leading-tight">{p.name}</h1>

          {/* price */}
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-3xl font-extrabold text-ivory">{inr(p.price)}</span>
            {off > 0 && <span className="text-lg text-muted line-through">{inr(p.mrp)}</span>}
            {off > 0 && <span className="text-white text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: MAROON }}>{off}% OFF</span>}
          </div>
          {off > 0 && <p className="mt-1 text-sm font-semibold text-emerald-600">You save {inr(p.mrp - p.price)}</p>}
          <p className="mt-0.5 text-xs text-muted">Inclusive of all taxes</p>

          {/* delivery to */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span className="grid place-items-center w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: `${MAROON}14`, color: MAROON }}><MapPin size={17} /></span>
            <div className="text-sm leading-tight">
              <p className="text-ivory font-semibold">Deliver to {loc}</p>
              <p className="text-muted text-xs flex items-center gap-1"><Clock size={12} /> Delivered in minutes · {BRAND.workingHours}</p>
            </div>
          </div>

          {/* offers */}
          <div className="mt-3 rounded-xl border border-dashed px-4 py-3 space-y-2" style={{ borderColor: `${MAROON}55`, backgroundColor: `${MAROON}08` }}>
            <p className="flex items-center gap-2 text-xs font-semibold text-ivory"><Tag size={13} style={{ color: MAROON }} /> Available offers</p>
            <p className="text-xs text-muted flex items-start gap-1.5"><BadgeCheck size={13} className="mt-0.5 text-emerald-600 shrink-0" /> Try before you pay — keep only what fits.</p>
            <p className="text-xs text-muted flex items-start gap-1.5"><BadgeCheck size={13} className="mt-0.5 text-emerald-600 shrink-0" /> Free delivery on orders above {inr(BRAND.freeDeliveryAbove)}.</p>
          </div>

          {p.colors?.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold text-ivory mb-2">Colour{color ? <span className="text-muted font-normal"> · {color}</span> : ''}</div>
              <div className="flex flex-wrap gap-2.5">
                {p.colors.map((c) => {
                  const nm = c.name || c; const hx = c.hex || '#ccc';
                  const on = color === nm;
                  return (
                    <button key={nm} onClick={() => setColor(nm)} title={nm}
                      className="w-9 h-9 rounded-full border-2 transition-all grid place-items-center"
                      style={{ borderColor: on ? MAROON : '#E7E2F0', transform: on ? 'scale(1.1)' : 'none' }}>
                      <span className="w-6 h-6 rounded-full" style={{ backgroundColor: hx }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {p.sizes?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-ivory">Select size</span>
                <span className="text-xs font-semibold" style={{ color: MAROON }}>Size guide</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => {
                  const on = size === s;
                  return (
                    <button key={s} onClick={() => setSize(s)}
                      className="min-w-[3rem] rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors"
                      style={on ? { borderColor: MAROON, backgroundColor: `${MAROON}12`, color: MAROON } : { borderColor: '#E7E2F0', color: '#8b83a0' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* quantity */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-ivory mb-2">Quantity</div>
            <div className="inline-flex items-center rounded-full border border-line overflow-hidden">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 grid place-items-center text-ivory hover:bg-lilacbg disabled:opacity-30" disabled={qty <= 1}><Minus size={16} /></button>
              <span className="w-10 text-center font-bold text-ivory">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(maxQty(p), q + 1))} className="w-11 h-11 grid place-items-center text-ivory hover:bg-lilacbg disabled:opacity-30" disabled={out || qty >= maxQty(p)}><Plus size={16} /></button>
            </div>
          </div>

          {/* actions */}
          <div className="mt-7 flex items-stretch gap-3">
            <button onClick={() => toggleWish(p)} aria-label="Wishlist"
              className="shrink-0 grid place-items-center w-14 rounded-full border transition-all active:scale-95"
              style={{ borderColor: wished ? '#F43F8F' : '#E7E2F0' }}>
              <Heart size={20} className={wished ? 'fill-fashionpink text-fashionpink' : 'text-muted'} />
            </button>
            <button onClick={onAdd} disabled={out}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full text-white px-6 py-4 font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: MAROON, boxShadow: `0 8px 22px ${MAROON}44` }}>
              {added ? <><Check size={18} /> Added to bag</> : out ? 'Out of stock' : 'Add to bag'}
            </button>
          </div>
          <button onClick={onBuy} disabled={out}
            className="mt-3 w-full rounded-full border-2 px-6 py-3.5 font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ borderColor: MAROON, color: MAROON }}>
            Buy now
          </button>

          {/* trust strip */}
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[[Truck, 'Delivery in minutes'], [RefreshCw, 'Try before you pay'], [ShieldCheck, 'Secure payment']].map(([Icon, label]) => (
              <div key={label} className="rounded-xl border border-line bg-surface p-3 text-center">
                <Icon size={18} className="mx-auto" style={{ color: MAROON }} />
                <div className="mt-2 text-[11px] font-medium text-muted leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* details */}
          <div className="mt-9">
            <h2 className="font-display text-lg font-bold text-ivory">Product details</h2>
            <p className="mt-3 text-sm text-muted leading-relaxed whitespace-pre-line">{p.description}</p>
            <div className="mt-5 rounded-xl border border-line overflow-hidden">
              {specs.map(([k, v], i) => (
                <div key={k} className={cx('grid grid-cols-[130px_1fr] gap-3 px-4 py-3 text-sm', i % 2 === 0 ? 'bg-surface' : 'bg-white')}>
                  <span className="text-muted">{k}</span>
                  <span className="text-ivory font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* sticky mobile checkout bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="leading-none">
          <div className="font-display text-lg font-extrabold text-ivory">{inr(p.price)}</div>
          {off > 0 && <div className="text-[11px] text-muted line-through">{inr(p.mrp)}</div>}
        </div>
        <button onClick={onBuy} disabled={out}
          className="flex-1 rounded-full text-white py-3.5 font-semibold active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: MAROON }}>
          {out ? 'Out of stock' : 'Buy now'}
        </button>
        <button onClick={onAdd} disabled={out}
          className="rounded-full border-2 px-5 py-3.5 font-semibold active:scale-[0.98] disabled:opacity-40"
          style={{ borderColor: MAROON, color: MAROON }}>
          {added ? <Check size={18} /> : 'Add'}
        </button>
      </div>
    </div>
  );
}


function Gallery({ images, name, off }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const list = images.length ? images : [''];
  const go = (d) => setActive((a) => (a + d + list.length) % list.length);

  // keyboard + scroll lock while the full-screen viewer is open
  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, list.length]);

  return (
    // Sticks just below the header (~124px) instead of sliding under it, and is
    // never taller than the screen — so the whole product is always in view.
    <div className="md:sticky md:top-[140px] self-start">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[3/4] md:aspect-auto md:h-[calc(100svh_-_170px)] md:min-h-[420px] md:max-h-[760px] rounded-[1.5rem] overflow-hidden border border-line bg-white">
        <button type="button" onClick={() => setZoom(true)} aria-label="View full image"
          className="absolute inset-0 w-full h-full cursor-zoom-in">
          {/* contain, not cover: the full garment is shown, nothing cut off */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[active]} alt={name} className="h-full w-full object-contain" />
        </button>
        {off > 0 && <span className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1 rounded-full pointer-events-none" style={{ backgroundColor: MAROON }}>{off}% OFF</span>}
        <span className="absolute top-4 right-4 hidden md:inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ivory shadow-soft pointer-events-none">
          <Maximize2 size={12} /> Click to view
        </span>
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur grid place-items-center shadow-soft hover:bg-white"><ChevronLeft size={20} className="text-ivory" /></button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur grid place-items-center shadow-soft hover:bg-white"><ChevronRight size={20} className="text-ivory" /></button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {list.map((_, i) => <span key={i} className={cx('h-1.5 rounded-full transition-all', i === active ? 'w-5' : 'w-1.5 opacity-50')} style={{ backgroundColor: MAROON }} />)}
            </div>
          </>
        )}
      </motion.div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {list.map((url, i) => (
            <button key={i} onClick={() => setActive(i)} className="shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition bg-white"
              style={{ borderColor: i === active ? MAROON : '#E7E2F0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* ── full-screen viewer: just the photo, nothing else ── */}
      {zoom && (
        <div className="fixed inset-0 z-[400] bg-black/90 flex flex-col" onClick={() => setZoom(false)} role="dialog" aria-modal="true" aria-label={name}>
          <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm">
            <span className="truncate pr-4">{name}{list.length > 1 ? ` · ${active + 1}/${list.length}` : ''}</span>
            <button onClick={() => setZoom(false)} aria-label="Close" className="w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white"><X size={20} /></button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={list[active]} alt={name} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full object-contain select-none" />
            {list.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center text-white"><ChevronLeft size={22} /></button>
                <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center text-white"><ChevronRight size={22} /></button>
              </>
            )}
          </div>
          {list.length > 1 && (
            <div className="flex justify-center gap-2 pb-5 px-4 overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
              {list.map((url, i) => (
                <button key={i} onClick={() => setActive(i)} className="shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 bg-white" style={{ borderColor: i === active ? '#fff' : 'transparent', opacity: i === active ? 1 : 0.6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
