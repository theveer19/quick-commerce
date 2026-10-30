'use client';
// Real customer reviews on the product page. Only people whose order was
// delivered can write one (from their order page), so every review is verified.
import { useEffect, useState } from 'react';
import { Star, BadgeCheck } from 'lucide-react';
import { cx } from '@/lib/format';

export function Stars({ value = 0, size = 14, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-line text-line'} />
      ))}
    </span>
  );
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ProductReviews({ productId, accent = '#8C1C13' }) {
  const [data, setData] = useState(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews?product=${encodeURIComponent(productId)}`)
      .then((r) => r.json()).then((j) => { if (alive) setData(j); })
      .catch(() => { if (alive) setData({ count: 0, reviews: [] }); });
    return () => { alive = false; };
  }, [productId]);

  if (!data) return null;
  const list = all ? data.reviews : data.reviews.slice(0, 4);

  return (
    <section id="reviews" className="mt-12 scroll-mt-32">
      <h2 className="font-display text-lg font-bold text-ivory">Ratings &amp; reviews</h2>

      {data.count === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-surface px-5 py-6 text-center">
          <Stars value={0} size={18} />
          <p className="mt-2 text-sm font-semibold text-ivory">No reviews yet</p>
          <p className="mt-1 text-xs text-muted">Bought this? You can rate it from your order page once it&apos;s delivered.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid items-center gap-5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-[150px_1fr]">
            <div className="text-center sm:border-r sm:border-line sm:pr-5">
              <div className="font-display text-4xl font-extrabold text-ivory">{Number(data.avg).toFixed(1)}</div>
              <Stars value={data.avg} size={16} className="mt-1" />
              <p className="mt-1 text-xs text-muted">{data.count} verified rating{data.count === 1 ? '' : 's'}</p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = data.dist?.[n] || 0;
                const pct = data.count ? Math.round((c / data.count) * 100) : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-muted">{n}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-cloud">
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: n >= 3 ? '#10B981' : n === 2 ? '#F59E0B' : '#EF4444' }} />
                    </span>
                    <span className="w-6 text-right text-muted">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
            {list.map((r, i) => (
              <li key={i} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                    {r.rating} <Star size={11} className="fill-emerald-600 text-emerald-600" />
                  </span>
                  <span className="text-[11px] text-muted">{fmtDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-ivory/90">{r.comment}</p>}
                <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                  {r.name} · <BadgeCheck size={13} className="text-emerald-600" /> Verified buyer
                </p>
              </li>
            ))}
          </ul>
          {data.reviews.length > 4 && !all && (
            <button onClick={() => setAll(true)} className="mt-3 text-sm font-semibold hover:underline" style={{ color: accent }}>
              Show all {data.reviews.length} reviews
            </button>
          )}
        </>
      )}
    </section>
  );
}
