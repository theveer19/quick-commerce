'use client';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { fetchProducts } from '@/lib/data';
import { outOfStock } from '@/lib/stock';

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl2 bg-surface border border-line" />
      <div className="mt-3 h-4 w-2/3 bg-surface rounded" />
      <div className="mt-2 h-4 w-1/3 bg-surface rounded" />
    </div>
  );
}

const colorName = (c) => String(c?.name || c || '').trim();

/** Apply the listing filters ({ sizes, colors, price:[min,max], inStock }) and sort. */
export function applyFilters(rows, filters = {}, sort = 'new') {
  let out = rows;
  const { sizes = [], colors = [], price, inStock } = filters;
  if (sizes.length) out = out.filter((p) => (p.sizes || []).some((s) => sizes.includes(String(s).trim())));
  if (colors.length) {
    const want = colors.map((c) => c.toLowerCase());
    out = out.filter((p) => (p.colors || []).some((c) => want.includes(colorName(c).toLowerCase())));
  }
  if (price) out = out.filter((p) => Number(p.price) >= price[0] && Number(p.price) <= price[1]);
  if (inStock) out = out.filter((p) => !outOfStock(p));

  const off = (p) => (p.mrp > p.price ? 1 - p.price / p.mrp : 0);
  const sorted = [...out];
  if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') sorted.sort((a, b) => b.price - a.price);
  else if (sort === 'discount') sorted.sort((a, b) => off(b) - off(a));
  else if (sort === 'rating') sorted.sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0) || (b.rating_count || 0) - (a.rating_count || 0));
  // in-stock first, whatever the sort
  return sorted.sort((a, b) => Number(outOfStock(a)) - Number(outOfStock(b)));
}

export default function ProductGrid({ category, sub, search, limit, filters, sort, onRows, onClear }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setRows(null);
    setError('');
    fetchProducts({ category, sub, search })
      .then((r) => { if (alive) { setRows(r); onRows?.(r); } })
      .catch((e) => { if (alive) setError(e.message || 'Could not load products'); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sub, search]);

  const items = useMemo(() => {
    if (!rows) return null;
    const list = filters || sort ? applyFilters(rows, filters, sort) : rows;
    return limit ? list.slice(0, limit) : list;
  }, [rows, filters, sort, limit]);

  if (error) {
    return <p className="text-sm text-rose py-8">Couldn&apos;t load products. {error}</p>;
  }

  if (!items) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
        {Array.from({ length: limit || 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    const filtered = rows?.length > 0;
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl text-ivory">{filtered ? 'Nothing matches these filters.' : 'No styles here yet.'}</p>
        <p className="text-muted mt-2 text-sm">{filtered ? 'Try another size or a wider price range.' : 'Try another category — new drops land daily.'}</p>
        {filtered && onClear && (
          <button onClick={onClear} className="mt-4 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white">Clear filters</button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
      {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
    </div>
  );
}
