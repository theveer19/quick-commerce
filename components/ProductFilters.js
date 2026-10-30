'use client';
// Filter + sort bar for the products page: quick size chips, a sort menu and
// a full "Filters" drawer (size, price, colour, in-stock).
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Check, ChevronDown } from 'lucide-react';
import { applyFilters } from './ProductGrid';
import { cx } from '@/lib/format';

export const SORTS = [
  ['new', 'Newest first'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['discount', 'Biggest discount'],
  ['rating', 'Top rated'],
];
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];
const PRICES = [[0, 499, 'Under ₹500'], [500, 999, '₹500 – ₹999'], [1000, 1999, '₹1,000 – ₹1,999'], [2000, 1e9, '₹2,000 & above']];
export const EMPTY = { sizes: [], colors: [], price: null, inStock: false };

const sizeRank = (s) => {
  const i = SIZE_ORDER.indexOf(String(s).toUpperCase());
  if (i >= 0) return i;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? 100 + n : 1000;
};

export function activeCount(f) {
  return f.sizes.length + f.colors.length + (f.price ? 1 : 0) + (f.inStock ? 1 : 0);
}

export default function ProductFilters({ rows, value, onChange, sort, onSort }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);

  // facets come from the products actually on this page
  const facets = useMemo(() => {
    const sizes = new Set(); const colors = new Map();
    (rows || []).forEach((p) => {
      (p.sizes || []).forEach((s) => s && sizes.add(String(s).trim()));
      (p.colors || []).forEach((c) => {
        const name = String(c?.name || c || '').trim();
        if (name && !colors.has(name.toLowerCase())) colors.set(name.toLowerCase(), { name, hex: c?.hex || '#ccc' });
      });
    });
    const prices = PRICES.filter(([a, b]) => (rows || []).some((p) => p.price >= a && p.price <= b));
    return {
      sizes: [...sizes].filter((s) => !/free|one size/i.test(s)).sort((a, b) => sizeRank(a) - sizeRank(b)),
      colors: [...colors.values()].slice(0, 24),
      prices,
    };
  }, [rows]);

  const toggle = (f, key, v) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] });
  const n = activeCount(value);
  const draftCount = rows ? applyFilters(rows, draft, sort).length : 0;

  // lock scroll while the drawer is open
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const chips = [
    ...value.sizes.map((s) => ({ label: `Size ${s}`, clear: () => onChange(toggle(value, 'sizes', s)) })),
    ...value.colors.map((c) => ({ label: c, clear: () => onChange(toggle(value, 'colors', c)) })),
    ...(value.price ? [{ label: PRICES.find((p) => p[0] === value.price[0])?.[2] || 'Price', clear: () => onChange({ ...value, price: null }) }] : []),
    ...(value.inStock ? [{ label: 'In stock', clear: () => onChange({ ...value, inStock: false }) }] : []),
  ];

  return (
    <div>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(true)}
          className={cx('inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
            n ? 'border-rose bg-rose text-white' : 'border-line bg-white text-ivory hover:border-rose/50')}>
          <SlidersHorizontal size={15} /> Filters{n ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] text-rose">{n}</span> : null}
        </button>

        {/* quick size chips */}
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar">
          {facets.sizes.slice(0, 10).map((s) => {
            const on = value.sizes.includes(s);
            return (
              <button key={s} onClick={() => onChange(toggle(value, 'sizes', s))}
                className={cx('shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors',
                  on ? 'border-plum bg-plum font-semibold text-white' : 'border-line bg-white text-muted hover:text-ivory')}>
                {s}
              </button>
            );
          })}
        </div>

        <label className="relative hidden shrink-0 sm:block">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}
            className="h-10 appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-sm font-medium text-ivory outline-none focus:border-rose">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
        </label>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-lilacbg px-3 py-1.5 text-xs font-semibold text-plum hover:bg-lilacbg/70">
              {c.label} <X size={12} />
            </button>
          ))}
          <button onClick={() => onChange(EMPTY)} className="text-xs font-semibold text-muted hover:text-ivory">Clear all</button>
        </div>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div key="f-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] bg-[#0F0A1F]/50 backdrop-blur-[3px]" onClick={() => setOpen(false)}>
              <motion.aside
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Filters"
                className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-pop">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h3 className="font-display text-lg font-extrabold text-ivory">Filter &amp; sort</h3>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ivory/70 hover:bg-lilacbg"><X size={18} /></button>
                </div>

                <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
                  <Section title="Sort by">
                    <div className="grid gap-1.5">
                      {SORTS.map(([v, l]) => (
                        <button key={v} onClick={() => onSort(v)}
                          className={cx('flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition',
                            sort === v ? 'bg-lilacbg/60 font-semibold text-ivory' : 'text-ivory/80 hover:bg-cloud')}>
                          {l} {sort === v && <Check size={16} className="text-rose" />}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {facets.sizes.length > 0 && (
                    <Section title="Size">
                      <div className="flex flex-wrap gap-2">
                        {facets.sizes.map((s) => {
                          const on = draft.sizes.includes(s);
                          return (
                            <button key={s} onClick={() => setDraft(toggle(draft, 'sizes', s))}
                              className={cx('min-w-[3rem] rounded-xl border px-3.5 py-2 text-sm font-semibold transition',
                                on ? 'border-rose bg-rose text-white' : 'border-line text-ivory/80 hover:border-rose/50')}>{s}</button>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {facets.prices.length > 0 && (
                    <Section title="Price">
                      <div className="grid grid-cols-2 gap-2">
                        {facets.prices.map(([a, b, l]) => {
                          const on = draft.price?.[0] === a;
                          return (
                            <button key={a} onClick={() => setDraft({ ...draft, price: on ? null : [a, b] })}
                              className={cx('rounded-xl border px-3 py-2.5 text-sm transition',
                                on ? 'border-rose bg-lilacbg/60 font-semibold text-ivory' : 'border-line text-ivory/80 hover:border-rose/50')}>{l}</button>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {facets.colors.length > 0 && (
                    <Section title="Colour">
                      <div className="flex flex-wrap gap-2">
                        {facets.colors.map((c) => {
                          const on = draft.colors.includes(c.name);
                          return (
                            <button key={c.name} onClick={() => setDraft(toggle(draft, 'colors', c.name))}
                              className={cx('inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition',
                                on ? 'border-rose bg-lilacbg/60 font-semibold text-ivory' : 'border-line text-ivory/80 hover:border-rose/50')}>
                              <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} /> {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  <Section title="Availability">
                    <button onClick={() => setDraft({ ...draft, inStock: !draft.inStock })} className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-sm text-ivory">
                      Show in-stock items only
                      <span className={cx('relative h-6 w-11 rounded-full transition', draft.inStock ? 'bg-rose' : 'bg-line')}>
                        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', draft.inStock ? 'left-[22px]' : 'left-0.5')} />
                      </span>
                    </button>
                  </Section>
                </div>

                <div className="flex items-center gap-3 border-t border-line px-5 py-4">
                  <button onClick={() => setDraft(EMPTY)} className="rounded-full px-4 py-3 text-sm font-semibold text-muted hover:text-ivory">Clear all</button>
                  <button onClick={() => { onChange(draft); setOpen(false); }}
                    className="flex-1 rounded-full bg-rose py-3 text-sm font-semibold text-white shadow-glow hover:bg-plum">
                    Show {draftCount} product{draftCount === 1 ? '' : 's'}
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">{title}</h4>
      {children}
    </div>
  );
}

