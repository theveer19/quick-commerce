'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Tag, Check, X } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { SUPABASE_READY } from '@/lib/config';
import { inr } from '@/lib/format';

const EMPTY = { code: '', type: 'flat', value: '', min_order: '', max_discount: '', expires_at: '', active: true };

export default function AdminCoupons() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sb = getSupabaseBrowser();

  const load = async () => {
    if (!sb) { setList([]); return; }
    const { data } = await sb.from('coupons').select('*').order('created_at', { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setErr('');
    const code = form.code.trim().toUpperCase();
    if (code.length < 3) return setErr('Enter a coupon code (min 3 chars)');
    if (!form.value || Number(form.value) <= 0) return setErr('Enter a valid discount value');
    if (!sb) return setErr('Connect Supabase to save coupons');
    setBusy(true);
    const row = {
      code, type: form.type, value: Number(form.value),
      min_order: Number(form.min_order) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      expires_at: form.expires_at || null,
      active: form.active,
    };
    const { error } = await sb.from('coupons').upsert(row, { onConflict: 'code' });
    setBusy(false);
    if (error) return setErr(error.message);
    setForm(EMPTY); load();
  };

  const toggle = async (c) => { if (sb) { await sb.from('coupons').update({ active: !c.active }).eq('code', c.code); load(); } };
  const remove = async (code) => { if (sb && confirm(`Delete coupon ${code}?`)) { await sb.from('coupons').delete().eq('code', code); load(); } };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-ivory mb-1">Coupons</h1>
      <p className="text-muted text-sm mb-6">Create discount codes customers apply at checkout.</p>

      {!SUPABASE_READY && <p className="mb-4 text-sm bg-violet/15 text-violet rounded-lg px-3 py-2">Demo mode — connect Supabase (and run the coupons SQL) to save real coupons. The demo code <b>FREEDOM</b> (₹150 off) works for testing.</p>}

      {/* create form */}
      <div className="rounded-xl2 border border-line bg-surface p-5 shadow-soft mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="text-sm text-muted">Code</span>
            <input value={form.code} onChange={set('code')} placeholder="FREEDOM" className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet uppercase" /></label>
          <label className="block"><span className="text-sm text-muted">Type</span>
            <select value={form.type} onChange={set('type')} className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet">
              <option value="flat">Flat ₹ off</option>
              <option value="percent">Percent % off</option>
            </select></label>
          <label className="block"><span className="text-sm text-muted">{form.type === 'percent' ? 'Percent (e.g. 10)' : 'Amount ₹ (e.g. 150)'}</span>
            <input value={form.value} onChange={set('value')} inputMode="numeric" className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" /></label>
          <label className="block"><span className="text-sm text-muted">Min order ₹ (optional)</span>
            <input value={form.min_order} onChange={set('min_order')} inputMode="numeric" className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" /></label>
          {form.type === 'percent' && (
            <label className="block"><span className="text-sm text-muted">Max discount ₹ (optional)</span>
              <input value={form.max_discount} onChange={set('max_discount')} inputMode="numeric" className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" /></label>
          )}
          <label className="block"><span className="text-sm text-muted">Expires on (optional)</span>
            <input type="date" value={form.expires_at} onChange={set('expires_at')} className="mt-1 w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" /></label>
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm text-ivory"><input type="checkbox" checked={form.active} onChange={set('active')} /> Active</label>
        {err && <p className="mt-2 text-sm text-rose">{err}</p>}
        <button onClick={save} disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose text-white px-6 py-2.5 font-semibold shadow-glow disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Save coupon
        </button>
      </div>

      {/* list */}
      {list === null ? <Loader2 className="animate-spin text-muted" /> : list.length === 0 ? (
        <p className="text-muted text-sm">No coupons yet.</p>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.code} className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-soft">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-lilacbg text-rose"><Tag size={18} /></span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-ivory">{c.code}</p>
                <p className="text-sm text-muted">{c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`}{c.min_order ? ` · min ${inr(c.min_order)}` : ''}{c.expires_at ? ` · till ${c.expires_at}` : ''}</p>
              </div>
              <button onClick={() => toggle(c)} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.active ? 'bg-mint/15 text-mint' : 'bg-muted/15 text-muted'}`}>{c.active ? 'Active' : 'Off'}</button>
              <button onClick={() => remove(c.code)} className="text-muted hover:text-rose p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}