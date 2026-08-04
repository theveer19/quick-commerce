'use client';
import { useEffect, useState } from 'react';
import { Minus, Plus, Check, Search } from 'lucide-react';
import { adminListProducts, updateStock } from '@/lib/data';
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

  const shown = (list || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const low = (list || []).filter((p) => (p.stock ?? 0) <= 5);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ivory">Inventory</h1>
      <p className="text-muted text-sm mt-1">Adjust stock levels. Items at 0 show as sold out in the store.</p>

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
            <div key={p.id} className="flex items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="w-10 h-12 object-cover rounded-md bg-ink shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ivory truncate">{p.name}</p>
                <p className="text-xs text-muted capitalize">{p.category}</p>
              </div>
              <div className="flex items-center gap-2">
                {saved === p.id && <Check size={16} className="text-mint" />}
                <button onClick={() => change(p.id, (p.stock ?? 0) - 1)} className="grid place-items-center w-8 h-8 rounded-full border border-line hover:bg-lilacbg" aria-label="Decrease"><Minus size={14} /></button>
                <input value={p.stock ?? 0} onChange={(e) => change(p.id, e.target.value)} inputMode="numeric"
                  className={cx('w-14 text-center bg-ink border rounded-lg py-1.5 text-sm outline-none',
                    (p.stock ?? 0) === 0 ? 'border-rose text-rose' : 'border-line text-ivory')} />
                <button onClick={() => change(p.id, (p.stock ?? 0) + 1)} className="grid place-items-center w-8 h-8 rounded-full border border-line hover:bg-lilacbg" aria-label="Increase"><Plus size={14} /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
