'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { adminListProducts, saveProduct, deleteProduct } from '@/lib/data';
import { CATEGORIES, SUBCATEGORIES } from '@/lib/seed';
import { inr, cx } from '@/lib/format';

const blank = { name: '', category: 'women', subcategory: '', price: '', mrp: '', stock: '', sizes: '', colors: '', image: '', description: '', is_active: true };

export default function AdminProducts() {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () => adminListProducts().then(setList);
  useEffect(() => { load(); }, []);

  const onDelete = async (id) => { await deleteProduct(id); setConfirm(null); load(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ivory">Products</h1>
          <p className="text-muted text-sm mt-1">{list?.length ?? '—'} products</p>
        </div>
        <button onClick={() => setEditing({ ...blank })}
          className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-5 py-2.5 text-sm font-semibold shadow-glow">
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="mt-6 rounded-xl2 border border-line bg-surface overflow-hidden">
        {!list ? (
          <p className="p-6 text-muted text-sm">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-muted text-sm">No products yet. Add your first product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-muted border-b border-line">
                <tr>
                  <th className="text-left font-medium p-4">Product</th>
                  <th className="text-left font-medium p-4">Category</th>
                  <th className="text-left font-medium p-4">Price</th>
                  <th className="text-left font-medium p-4">Stock</th>
                  <th className="text-right font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="w-10 h-12 object-cover rounded-md bg-ink" />
                        <span className="font-medium text-ivory">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted capitalize">{p.category}</td>
                    <td className="p-4 text-ivory">{inr(p.price)}</td>
                    <td className="p-4">
                      <span className={cx('px-2 py-0.5 rounded-full text-xs font-medium',
                        (p.stock ?? 0) === 0 ? 'bg-rose/20 text-rose' : (p.stock ?? 0) <= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-mint/20 text-mint')}>
                        {p.stock ?? 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing({ ...p, sizes: (p.sizes || []).join(', '), colors: (p.colors || []).map((c) => (c.hex ? `${c.name}:${c.hex}` : (c.name || c))).join(', ') })}
                          className="p-2 rounded-lg text-muted hover:text-violet hover:bg-lilacbg" aria-label="Edit"><Pencil size={16} /></button>
                        <button onClick={() => setConfirm(p)}
                          className="p-2 rounded-lg text-muted hover:text-rose hover:bg-lilacbg" aria-label="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && <ProductModal initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <Overlay onClose={() => setConfirm(null)}>
            <h3 className="font-display text-lg font-semibold text-ivory">Delete “{confirm.name}”?</h3>
            <p className="text-muted text-sm mt-2">This can&apos;t be undone.</p>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="rounded-full border border-line px-5 py-2 text-sm text-ivory">Cancel</button>
              <button onClick={() => onDelete(confirm.id)} className="rounded-full bg-rose text-white px-5 py-2 text-sm font-semibold">Delete</button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.price) return setErr('Name and price are required');
    setBusy(true); setErr('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp) || Number(form.price),
        stock: Number(form.stock) || 0,
        subcategory: form.subcategory || null,
        sizes: String(form.sizes || '').split(',').map((s) => s.trim()).filter(Boolean),
        colors: String(form.colors || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => {
          const [name, hex] = t.split(':').map((x) => x.trim());
          return { name: name || 'Color', hex: hex || '#cccccc' };
        }),
        image: form.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80',
        is_active: form.is_active !== false,
      };
      if (!payload.id) delete payload.id;
      await saveProduct(payload);
      onSaved();
    } catch (e) { setErr(e.message || 'Save failed'); setBusy(false); }
  };

  return (
    <Overlay onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-ivory">{form.id ? 'Edit product' : 'Add product'}</h3>
        <button onClick={onClose} className="text-muted hover:text-ivory"><X size={20} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="Name" full value={form.name} onChange={set('name')} />
        <label className="block">
          <span className="text-xs text-muted">Category</span>
          <select value={form.category} onChange={set('category')} className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet">
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Subcategory</span>
          <select value={form.subcategory || ''} onChange={set('subcategory')} className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet">
            <option value="">—</option>
            {(SUBCATEGORIES[form.category] || []).map((sc) => <option key={sc.slug} value={sc.slug}>{sc.name}</option>)}
          </select>
        </label>
        <F label="Image URL" value={form.image} onChange={set('image')} placeholder="https://…" />
        <F label="Price (₹)" value={form.price} onChange={set('price')} inputMode="numeric" />
        <F label="MRP (₹)" value={form.mrp} onChange={set('mrp')} inputMode="numeric" />
        <F label="Stock" value={form.stock} onChange={set('stock')} inputMode="numeric" />
        <F label="Sizes (comma separated)" value={form.sizes} onChange={set('sizes')} placeholder="S, M, L, XL" />
        <F label="Colors (Name:#hex, comma separated)" full value={form.colors} onChange={set('colors')} placeholder="Black:#222222, White:#FFFFFF" />
        <label className="block sm:col-span-2">
          <span className="text-xs text-muted">Description</span>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet resize-none" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
          <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          Active (visible in store)
        </label>
      </div>
      {err && <p className="mt-3 text-sm text-rose">{err}</p>}
      <div className="mt-6 flex gap-3 justify-end">
        <button onClick={onClose} className="rounded-full border border-line px-5 py-2 text-sm text-ivory">Cancel</button>
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-5 py-2 text-sm font-semibold disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin" />} Save product
        </button>
      </div>
    </Overlay>
  );
}

function F({ label, full, ...props }) {
  return (
    <label className={cx('block', full && 'sm:col-span-2')}>
      <span className="text-xs text-muted">{label}</span>
      <input {...props} className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet" />
    </label>
  );
}

function Overlay({ children, onClose, wide }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={cx('w-full rounded-xl2 border border-line bg-surface p-6 max-h-[90vh] overflow-y-auto', wide ? 'max-w-2xl' : 'max-w-md')}>
        {children}
      </motion.div>
    </motion.div>
  );
}
