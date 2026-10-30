'use client';
// "Rate your order" card on a delivered order — one star row + optional note per item.
import { useEffect, useState } from 'react';
import { Star, Check, Loader2 } from 'lucide-react';
import { sessionHeader } from '@/lib/user-auth';
import { cx } from '@/lib/format';

const LABEL = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Loved it!'];

export default function OrderReview({ order, accent = '#8C1C13' }) {
  // one entry per distinct product in the order
  const items = [];
  const seen = new Set();
  for (const it of order.items || []) {
    if (!it?.id || seen.has(String(it.id))) continue;
    seen.add(String(it.id));
    items.push(it);
  }

  const [vals, setVals] = useState({});      // product_id → { rating, comment }
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // already rated? show what they gave
  useEffect(() => {
    fetch(`/api/reviews?order=${encodeURIComponent(order.code)}`, { headers: sessionHeader() })
      .then((r) => r.json())
      .then((j) => {
        const v = {};
        (j.reviews || []).forEach((r) => { v[r.product_id] = { rating: r.rating, comment: r.comment || '' }; });
        if (Object.keys(v).length) { setVals(v); setDone(true); }
      })
      .catch(() => {});
  }, [order.code]);

  const set = (id, patch) => { setVals((m) => ({ ...m, [id]: { ...(m[id] || {}), ...patch } })); setErr(''); };

  const submit = async () => {
    const reviews = items.map((it) => ({ product_id: it.id, ...(vals[it.id] || {}) })).filter((r) => r.rating);
    if (!reviews.length) { setErr('Tap the stars to rate at least one item'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...sessionHeader() },
        body: JSON.stringify({ code: order.code, reviews }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not save your review');
      setDone(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (!items.length) return null;

  return (
    <div id="review" className="mt-6 scroll-mt-28 rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-ivory">{done ? 'Thanks for your review!' : 'How was your order?'}</h3>
          <p className="mt-0.5 text-sm text-muted">{done ? 'It helps other shoppers in Gwalior pick the right fit.' : 'Rate what you bought — it takes 10 seconds.'}</p>
        </div>
        {done && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check size={18} /></span>}
      </div>

      <div className="mt-4 divide-y divide-line">
        {items.map((it) => {
          const v = vals[it.id] || {};
          return (
            <div key={it.id} className="py-3.5">
              <div className="flex items-center gap-3">
                {it.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={it.image} alt="" className="h-14 w-12 shrink-0 rounded-lg border border-line object-cover" />
                  : <div className="h-14 w-12 shrink-0 rounded-lg bg-cloud" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ivory">{it.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" disabled={done} onClick={() => set(it.id, { rating: n })} aria-label={`${n} star`}
                        className="p-0.5 transition-transform enabled:hover:scale-110 disabled:cursor-default">
                        <Star size={24} className={n <= (v.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                      </button>
                    ))}
                    {v.rating ? <span className="ml-1.5 text-xs font-semibold text-ivory/70">{LABEL[v.rating]}</span> : null}
                  </div>
                </div>
              </div>
              {!done && v.rating ? (
                <textarea value={v.comment || ''} onChange={(e) => set(it.id, { comment: e.target.value.slice(0, 500) })}
                  rows={2} placeholder="How was the fit, fabric, colour? (optional)"
                  className="mt-3 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm text-ivory outline-none focus:border-rose focus-visible:outline-none" />
              ) : done && v.comment ? (
                <p className="mt-2 text-sm text-muted">“{v.comment}”</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}
      {done ? (
        <button onClick={() => setDone(false)} className="mt-3 text-sm font-semibold hover:underline" style={{ color: accent }}>Edit my review</button>
      ) : (
        <button onClick={submit} disabled={busy}
          className={cx('mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold text-white disabled:opacity-60')}
          style={{ backgroundColor: accent }}>
          {busy ? <><Loader2 size={17} className="animate-spin" /> Saving…</> : 'Submit review'}
        </button>
      )}
    </div>
  );
}
