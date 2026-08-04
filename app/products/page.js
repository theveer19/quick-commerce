'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import { CATEGORIES } from '@/lib/seed';
import { cx } from '@/lib/format';

function ProductsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get('category') || '';
  const sub = params.get('sub') || '';
  const search = params.get('search') || '';
  const active = CATEGORIES.find((c) => c.slug === category);

  const push = (next) => {
    const q = new URLSearchParams();
    if (next.category) q.set('category', next.category);
    if (next.sub) q.set('sub', next.sub);
    if (search) q.set('search', search);
    router.push(`/products?${q.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-2 text-sm text-muted">
        Home / Products{active ? ` / ${active.name}` : ''}{sub && active ? ` / ${active.subs.find((x) => x.slug === sub)?.name || ''}` : ''}
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

      {/* subcategory pills (only when a category is selected) */}
      {active?.subs?.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => push({ category })}
            className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] border transition-colors',
              !sub ? 'bg-plum text-white border-plum' : 'bg-white border-line text-muted hover:text-ivory')}>
            All {active.name}
          </button>
          {active.subs.map((sc) => (
            <button key={sc.slug} onClick={() => push({ category, sub: sc.slug })}
              className={cx('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] border transition-colors',
                sub === sc.slug ? 'bg-plum text-white border-plum' : 'bg-white border-line text-muted hover:text-ivory')}>
              {sc.name}
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
