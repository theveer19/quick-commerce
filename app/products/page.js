'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { CATEGORIES } from '@/lib/seed';
import { fetchSubcategories } from '@/lib/data';
import { cx } from '@/lib/format';

function ProductsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get('category') || '';
  const sub = params.get('sub') || '';
  const search = params.get('search') || '';
  const active = CATEGORIES.find((c) => c.slug === category);

  // Dynamic subcategories — built from the actual products in this category,
  // so whatever you type in admin (Pant, Top, Coord, Leggings, Maxi…) shows up
  // and filters correctly. No fixed list to maintain.
  const [subs, setSubs] = useState([]);
  useEffect(() => {
    let alive = true;
    if (!category) { setSubs([]); return; }
    fetchSubcategories(category)
      .then((list) => { if (alive) setSubs(list); })
      .catch(() => { if (alive) setSubs([]); });
    return () => { alive = false; };
  }, [category]);

  const push = (next) => {
    const q = new URLSearchParams();
    if (next.category) q.set('category', next.category);
    if (next.sub) q.set('sub', next.sub);
    if (search) q.set('search', search);
    router.push(`/products?${q.toString()}`);
  };

  const prettySub = sub || '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-2 text-sm text-muted">
        Home / Products{active ? ` / ${active.name}` : ''}{prettySub && active ? ` / ${prettySub}` : ''}
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-ivory">
        {search ? `Results for "${search}"` : active ? active.name : 'All products'}
      </h1>

      {/* category pills */}
      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => push({})}
          className={cx('shrink-0 rounded-full px-4 py-2 text-sm border transition-colors',
            !category ? 'bg-rose text-white border-rose' : 'border-line text-muted hover:text-ivory')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.slug} onClick={() => push({ category: c.slug })}
            className={cx('shrink-0 rounded-full px-4 py-2 text-sm border transition-colors',
              category === c.slug && !sub ? 'bg-rose text-white border-rose' : 'border-line text-muted hover:text-ivory')}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* subcategory pills — dynamic, from real products in this category */}
      {category && subs.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => push({ category })}
            className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] border transition-colors',
              !sub ? 'bg-plum text-white border-plum' : 'bg-white border-line text-muted hover:text-ivory')}>
            All {active?.name || ''}
          </button>
          {subs.map((sc) => (
            <button key={sc} onClick={() => push({ category, sub: sc })}
              className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] border transition-colors capitalize',
                sub.toLowerCase() === sc.toLowerCase() ? 'bg-plum text-white border-plum' : 'bg-white border-line text-muted hover:text-ivory')}>
              {sc}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <ProductGrid category={category} sub={sub} search={search} />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading…</div>}>
      <ProductsInner />
    </Suspense>
  );
}