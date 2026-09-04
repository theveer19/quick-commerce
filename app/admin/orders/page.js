'use client';
function fmtDT(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MapPin, Truck, Check, FileText } from 'lucide-react';
import { adminListOrders, updateOrderStatus, updateOrderPartner, ORDER_STAGES, STAGE_LABEL } from '@/lib/data';
import { inr, cx } from '@/lib/format';

const STATUS_OPTIONS = [...ORDER_STAGES, 'cancelled'];

const badgeColor = (s) =>
  s === 'delivered' ? 'bg-mint/20 text-mint'
  : s === 'cancelled' ? 'bg-rose/20 text-rose'
  : s === 'out_for_delivery' ? 'bg-violet/20 text-violet'
  : 'bg-yellow-500/20 text-yellow-400';

export default function AdminOrders() {
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => adminListOrders().then(setList);
  useEffect(() => { load(); }, []);

  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 4500); };

  const setStatus = async (code, status) => {
    try {
      await updateOrderStatus(code, status);
    } catch (e) { notify('Could not update status: ' + (e.message || 'unknown') ); return; }
    load();
    setDetail((d) => (d && d.code === code ? { ...d, status } : d));
  };

  const savePartner = async (code, partner) => {
    try {
      await updateOrderPartner(code, partner);
    } catch (e) { notify('Could not assign partner: ' + (e.message || 'unknown')); return; }
    load();
    setDetail((d) => (d && d.code === code ? { ...d, delivery_partner: partner } : d));
  };

  const shown = (list || []).filter((o) => filter === 'all' ? true : filter === 'active' ? (o.status !== 'delivered' && o.status !== 'cancelled') : o.status === filter);

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-[92%]">
          <div className="rounded-xl bg-rose text-white text-sm font-medium px-4 py-3 shadow-glow flex items-center gap-2">
            <span>⚠️</span><span>{toast}</span>
            <button onClick={() => setToast('')} className="ml-2 text-white/80">✕</button>
          </div>
        </div>
      )}
      <div>
      <h1 className="font-display text-2xl font-bold text-ivory">Orders</h1>
      <p className="text-muted text-sm mt-1">Update status to move the customer&apos;s live tracking.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['all', 'active', ...STATUS_OPTIONS].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cx('shrink-0 rounded-full px-4 py-1.5 text-sm border capitalize',
              filter === f ? 'bg-rose text-white border-rose' : 'border-line text-muted hover:text-ivory')}>
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : STAGE_LABEL[f] || f}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl2 border border-line bg-surface overflow-hidden">
        {!list ? <p className="p-6 text-muted text-sm">Loading…</p> :
          shown.length === 0 ? <p className="p-8 text-center text-muted text-sm">No orders here.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-muted border-b border-line">
                <tr>
                  <th className="text-left font-medium p-4">Order</th>
                  <th className="text-left font-medium p-4">Customer</th>
                  <th className="text-left font-medium p-4">Total</th>
                  <th className="text-left font-medium p-4">Payment</th>
                  <th className="text-left font-medium p-4">Placed at</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-left font-medium p-4">Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((o) => (
                  <tr key={o.code} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setDetail(o)}>
                    <td className="p-4"><span className="font-medium text-ivory">{o.code}</span><div className="text-xs text-muted">{o.items?.length} items</div></td>
                    <td className="p-4 text-muted">{o.customer?.name}<div className="text-xs">{o.customer?.phone}</div></td>
                    <td className="p-4 text-ivory">{inr(o.total)}</td>
                    <td className="p-4 text-muted">{o.payment_method === 'razorpay'
                      ? (o.payment_status === 'paid'
                          ? <span className="text-mint font-medium">Prepaid · Paid</span>
                          : <span className="text-rose font-medium">Prepaid · Unpaid</span>)
                      : 'Try & Buy'}</td>
                    <td className="p-4 text-xs text-muted whitespace-nowrap">{fmtDT(o.created_at)}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select value={o.status} onChange={(e) => setStatus(o.code, e.target.value)}
                        className={cx('rounded-full px-3 py-1 text-xs font-medium border-0 outline-none cursor-pointer', badgeColor(o.status))}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-surface text-ivory">{STAGE_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <a href={`/invoice/${o.code}`} target="_blank" rel="noreferrer" title="Open bill / download PDF"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-grape hover:bg-lilacbg/40">
                        <FileText size={13} /> Bill
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setDetail(null)}>
            <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-surface border-l border-line overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-ivory">{detail.code}</h2>
                <button onClick={() => setDetail(null)} className="text-muted hover:text-ivory"><X size={20} /></button>
              </div>
              <a href={`/invoice/${detail.code}`} target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-grape text-white px-4 py-2 text-sm font-semibold shadow-glow hover:opacity-90">
                <FileText size={15} /> View / download bill (PDF)
              </a>
              <p className="text-xs text-muted mt-1.5">Placed: {fmtDT(detail.created_at)}{detail.delivered_at ? ` · Delivered: ${fmtDT(detail.delivered_at)}` : ''}</p>

              <div className="mt-4">
                <span className={cx('inline-block rounded-full px-3 py-1 text-xs font-medium', badgeColor(detail.status))}>{STAGE_LABEL[detail.status]}</span>
              </div>

              <div className="mt-6 rounded-xl border border-line p-4">
                <p className="text-sm text-ivory font-medium">{detail.customer?.name}</p>
                <p className="text-sm text-muted mt-1 flex items-center gap-2"><Phone size={14} /> {detail.customer?.phone}</p>
                <p className="text-sm text-muted mt-1 flex items-start gap-2"><MapPin size={14} className="mt-0.5" /> {detail.address?.line}, {detail.address?.landmark && detail.address.landmark + ', '}{detail.address?.city} - {detail.address?.pincode}</p>
                {detail.address?.notes && <p className="text-xs text-muted mt-2">Note: {detail.address.notes}</p>}
                <a
                  href={detail.address?.lat && detail.address?.lng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${detail.address.lat},${detail.address.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([detail.address?.line, detail.address?.landmark, detail.address?.city, detail.address?.pincode].filter(Boolean).join(' '))}`}
                  target="_blank" rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose text-white px-4 py-2 text-sm font-semibold shadow-glow">
                  <MapPin size={15} /> {detail.address?.lat ? 'Navigate to exact pin' : 'Navigate (approx. by address)'}
                </a>
                {detail.address?.lat && <p className="text-[11px] text-mint mt-1">✓ Customer shared exact GPS location</p>}
              </div>

              <div className="mt-4 rounded-xl border border-line p-4">
                <h3 className="text-sm font-semibold text-ivory mb-2">Items</h3>
                {detail.items?.map((it, i) => (
                  <a key={i} href={`/product/${it.id}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 py-2 border-b border-line last:border-0 hover:bg-lilacbg/40 rounded-lg px-1 transition">
                    {it.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={it.image} alt={it.name} className="w-12 h-14 rounded-lg object-cover bg-ink shrink-0" />
                      : <div className="w-12 h-14 rounded-lg bg-ink shrink-0 grid place-items-center text-[9px] text-muted">No img</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-grape truncate hover:underline">{it.name || 'View product'}</p>
                      <p className="text-xs text-muted">{it.size ? `Size: ${it.size}` : ''}{it.size && it.color ? ' · ' : ''}{it.color ? `Color: ${it.color}` : ''}{(it.size || it.color) ? ' · ' : ''}Qty: {it.qty}</p>
                    </div>
                    <span className="text-sm font-semibold text-ivory shrink-0">{inr(it.price * it.qty)}</span>
                  </a>
                ))}
                <div className="border-t border-line mt-2 pt-2 flex justify-between text-sm">
                  <span className="text-muted">Delivery</span><span className="text-ivory">{detail.delivery === 0 ? 'Free' : inr(detail.delivery)}</span>
                </div>
                <div className="flex justify-between font-display font-bold text-ivory mt-1">
                  <span>Total</span><span>{inr(detail.total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted">Update status</label>
                <select value={detail.status} onChange={(e) => setStatus(detail.code, e.target.value)}
                  className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </select>
              </div>

              <PartnerEditor key={detail.code} detail={detail} onSave={savePartner} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}


function PartnerEditor({ detail, onSave }) {
  const [name, setName] = useState(detail.delivery_partner?.name || '');
  const [phone, setPhone] = useState(detail.delivery_partner?.phone || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setBusy(true); setSaved(false);
    try { await onSave(detail.code, name.trim() || phone.trim() ? { name: name.trim(), phone: phone.trim() } : null); setSaved(true); setTimeout(() => setSaved(false), 1500); } catch {}
    setBusy(false);
  };
  return (
    <div className="mt-4 rounded-lg border border-line p-3">
      <p className="text-xs text-muted flex items-center gap-1.5 mb-2"><Truck size={14} /> Delivery partner (customer can call)</p>
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Partner name" className="bg-ink border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-violet" />
        <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10-digit phone" className="bg-ink border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-violet" />
      </div>
      <button onClick={save} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-60">
        {saved ? <><Check size={13} /> Assigned</> : busy ? 'Saving…' : 'Assign partner'}
      </button>
    </div>
  );
}