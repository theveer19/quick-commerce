'use client';
// Size guide popup. Picks the chart from the product's sizes:
// waist sizes (26, 28 …) → bottoms chart, letter sizes (S, M …) → tops chart.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ruler, X } from 'lucide-react';
import { cx } from '@/lib/format';

const TOPS = {
  head: ['Size', 'Chest (in)', 'Shoulder (in)', 'Length (in)'],
  rows: [
    ['XS', '32 – 34', '15.5', '25'],
    ['S', '34 – 36', '16', '26'],
    ['M', '38 – 40', '17', '27'],
    ['L', '40 – 42', '18', '28'],
    ['XL', '42 – 44', '19', '29'],
    ['XXL', '44 – 46', '20', '30'],
    ['3XL', '46 – 48', '21', '31'],
  ],
};
const BOTTOMS = {
  head: ['Size', 'Waist (in)', 'Hip (in)', 'Fits like'],
  rows: [
    ['26', '26', '34 – 35', 'XS'],
    ['28', '28', '36 – 37', 'S'],
    ['30', '30', '38 – 39', 'M'],
    ['32', '32', '40 – 41', 'L'],
    ['34', '34', '42 – 43', 'XL'],
    ['36', '36', '44 – 45', 'XXL'],
    ['38', '38', '46 – 47', '3XL'],
    ['40', '40', '48 – 49', '4XL'],
  ],
};

export function chartFor(sizes = []) {
  const numeric = sizes.filter((s) => /^\d{2}$/.test(String(s).trim())).length;
  return numeric > sizes.length / 2 ? 'bottoms' : 'tops';
}

export default function SizeGuide({ sizes = [], accent = '#8C1C13' }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(chartFor(sizes));
  const free = sizes.length > 0 && sizes.every((s) => /free|one size/i.test(String(s)));

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const chart = tab === 'bottoms' ? BOTTOMS : TOPS;
  const have = new Set(sizes.map((s) => String(s).trim().toUpperCase()));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: accent }}>
        <Ruler size={13} /> Size guide
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-[#0F0A1F]/55 backdrop-blur-[4px] sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Size guide" onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[24px] bg-white p-6 shadow-pop sm:max-w-lg sm:rounded-[24px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-extrabold text-ivory">Size guide</h3>
                <p className="mt-1 text-sm text-muted">Body measurements in inches.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ivory/70 hover:bg-lilacbg"><X size={18} /></button>
            </div>

            {free ? (
              <p className="mt-5 rounded-xl bg-lilacbg/60 p-4 text-sm text-ivory">This piece is <b>Free Size</b> — it&apos;s cut to fit most body types (roughly S to XL).</p>
            ) : (
              <>
                <div className="mt-5 inline-flex rounded-full bg-cloud p-1 text-sm font-semibold">
                  {[['tops', 'Tops & shirts'], ['bottoms', 'Jeans & pants']].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)}
                      className={cx('rounded-full px-4 py-1.5 transition', tab === k ? 'bg-white text-ivory shadow-soft' : 'text-muted')}>{l}</button>
                  ))}
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-[13px] sm:text-sm">
                    <thead className="bg-cloud text-left text-xs uppercase tracking-wide text-muted">
                      <tr>{chart.head.map((h) => <th key={h} className="whitespace-nowrap px-2.5 py-2.5 font-semibold sm:px-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {chart.rows.map((r) => {
                        const mine = have.has(r[0]);
                        return (
                          <tr key={r[0]} className={mine ? 'bg-lilacbg/40' : ''}>
                            {r.map((c, i) => <td key={i} className={cx('whitespace-nowrap px-2.5 py-2.5 sm:px-3', i === 0 ? 'font-bold text-ivory' : 'text-ivory/80')}>{c}{i === 0 && mine && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose align-middle" aria-label="available" />}</td>)}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted"><span className="inline-block h-1.5 w-1.5 rounded-full bg-rose" /> Sizes available for this item</p>
              </>
            )}

            <div className="mt-5 grid gap-3 text-[13px] text-muted sm:grid-cols-2">
              <p><b className="text-ivory">How to measure:</b> chest around the fullest part, waist around your natural waistline, keeping the tape snug.</p>
              <p><b className="text-ivory">Between sizes?</b> Pick the bigger one — or order both with Try &amp; Buy and keep the one that fits.</p>
            </div>
            <p className="mt-4 text-[11.5px] text-muted">This is a standard chart; exact fit varies a little by style and brand.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
