'use client';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { fetchProducts } from '@/lib/data';

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl2 bg-surface border border-line" />
      <div className="mt-3 h-4 w-2/3 bg-surface rounded" />
      <div className="mt-2 h-4 w-1/3 bg-surface rounded" />
    </div>
  );
}

export default function ProductGrid({ category, sub, search, limit }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError('');
    fetchProducts({ category, sub, search })
      .then((rows) => { if (alive) setItems(limit ? rows.slice(0, limit) : rows); })
      .catch((e) => { if (alive) setError(e.message || 'Could not load products'); });
    return () => { alive = false; };
  }, [category, sub, search, limit]);

  if (error) {
    return <p className="text-sm text-rose py-8">Couldn&apos;t load products. {error}</p>;
  }

  if (!items) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {Array.from({ length: limit || 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl text-ivory">No styles here yet.</p>
        <p className="text-muted mt-2 text-sm">Try another category — new drops land daily.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
    </div>
  );
}
