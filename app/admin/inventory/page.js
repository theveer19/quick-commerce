'use client';
import { useEffect, useState } from 'react';
import { Minus, Plus, Check, Search } from 'lucide-react';
import { adminListProducts, updateStock, updateSizeStock } from '@/lib/data';
import { cx } from '@/lib/format';

export default function AdminInventory() {
  const [list, setList] = useState(null);
  const [saved, setSaved] = useState('');
  const [q, setQ] = useState('');

  const load = () => adminListProducts().then(setList);
  useEffect(() => { load(); }, []);

  const change = async (id, next) => {
    const stock = Math.max(0, Number(next) || 0);
    setList((l) => l.map((p) => (p.id === id ? { ...p, stock } : p)));
    await updateStock(id, stock);
    setSaved(id); setTimeout(() => setSaved(''), 1200);
  };

  const tracked = (p) => p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0;
  const changeSize = async (p, size, next) => {
    const qty = Math.max(0, Number(next) || 0);
    const size_stock = { ...p.size_stock, [size]: qty };
    const stock = Object.values(size_stock).reduce((a, n) => a + (Number(n) || 0), 0);
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, size_stock, stock } : x)));
    await updateSizeStock(p.id, size_stock);
    setSaved(p.id); setTimeout(() => setSaved(''), 1200);
  };

  const shown = (list || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const low = (list || []).filter((p) => (p.stock ?? 0) <= 5);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ivory">Inventory</h1>
      <p className="text-muted text-sm mt-1">Adjust stock levels. A size at 0 shows as sold out and cannot be ordered. To track a product size-wise, enter quantities per size in Products → Edit.</p>

      {low.length > 0 && (
        <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 px-4 py-3 text-sm">
          {low.length} item{low.length > 1 ? 's' : ''} low or out of stock — restock soon.
        </div>
      )}

      <div className="mt-6 relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
          className="w-full bg-surface border border-line rounded-full pl-9 pr-4 py-2.5 text-sm outline-none focus:border-violet" />
      </div>

      <div className="mt-4 rounded-xl2 border border-line bg-surface divide-y divide-line">
        {!list ? <p className="p-6 text-muted text-sm">Loading…</p> :
          shown.length === 0 ? <p className="p-8 text-center text-muted text-sm">No products found.</p> :
          shown.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="w-10 h-12 object-cover rounded-md bg-ink shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ivory truncate">{p.name}</p>
                <p className="text-xs text-muted capitalize">{p.category}</p>
              </div>
              {tracked(p) ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {saved === p.id && <Check size={16} className="text-mint" />}
                  {(p.sizes?.length ? p.sizes : Object.keys(p.size_stock)).filter((sz) => sz in p.size_stock).map((sz) => {
                    const n = Number(p.size_stock[sz]) || 0;
                    return (
                      <div key={sz} className={cx('flex items-center gap-1 rounded-lg border px-1.5 py-1', n === 0 ? 'border-rose/50 bg-rose/5' : 'border-line')}>
                        <span className="w-8 text-center text-[11px] font-bold text-ivory">{sz}</span>
                        <button onClick={() => changeSize(p, sz, n - 1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-lilacbg" aria-label={`Less ${sz}`}><Minus size={12} /></button>
                        <span className={cx('w-6 text-center text-sm font-semibold', n === 0 ? 'text-rose' : 'text-ivory')}>{n}</span>
                        <button onClick={() => changeSize(p, sz, n + 1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-lilacbg" aria-label={`More ${sz}`}><Plus size={12} /></button>
                      </div>
                    );
                  })}
                  <span className="ml-1 text-xs text-muted">= {p.stock ?? 0}</span>
                </div>
              ) : (
              <div className="flex items-center gap-2">
                {saved === p.id && <Check size={16} className="text-mint" />}
                <button onClick={() => change(p.id, (p.stock ?? 0) - 1)} className="grid place-items-center w-8 h-8 rounded-full border border-line hover:bg-lilacbg" aria-label="Decrease"><Minus size={14} /></button>
                <input value={p.stock ?? 0} onChange={(e) => change(p.id, e.target.value)} inputMode="numeric"
                  className={cx('w-14 text-center bg-ink border rounded-lg py-1.5 text-sm outline-none',
                    (p.stock ?? 0) === 0 ? 'border-rose text-rose' : 'border-line text-ivory')} />
                <button onClick={() => change(p.id, (p.stock ?? 0) + 1)} className="grid place-items-center w-8 h-8 rounded-full border border-line hover:bg-lilacbg" aria-label="Increase"><Plus size={14} /></button>
              </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
