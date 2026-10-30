'use client';
// "Cancel order" button + confirm sheet on the customer's order page.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertTriangle, MessageCircle } from 'lucide-react';
import { cancelOrder } from '@/lib/data';
import { BRAND } from '@/lib/config';
import { cx } from '@/lib/format';

const REASONS = ['Ordered by mistake', 'Want to change size or item', 'Found a better price', 'Delivery taking too long', 'Other'];

export default function CancelOrder({ order, onCancelled, accent = '#8C1C13' }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [support, setSupport] = useState(false);

  const prepaidPaid = order.payment_method === 'razorpay' && String(order.payment_status || '').startsWith('paid');
  const wa = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(`Hi, I want to cancel my order ${order.code}.`)}`;

  const submit = async () => {
    if (!reason) { setErr('Please pick a reason'); return; }
    setBusy(true); setErr('');
    try {
      await cancelOrder(order.code, reason, note);
      setOpen(false);
      onCancelled?.();
    } catch (e) { setErr(e.message); setSupport(Boolean(e.needsSupport)); }
    setBusy(false);
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setErr(''); }}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
        Cancel order
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-[#0F0A1F]/55 backdrop-blur-[4px] sm:items-center sm:p-4" onClick={() => !busy && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Cancel order" onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-[24px] bg-white p-6 shadow-pop sm:max-w-md sm:rounded-[24px]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={19} /></span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ivory">Cancel this order?</h3>
                  <p className="text-xs text-muted">{order.code}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ivory/70 hover:bg-lilacbg"><X size={18} /></button>
            </div>

            {prepaidPaid ? (
              <div className="mt-5 rounded-xl bg-lilacbg/60 p-4 text-sm text-ivory">
                You paid online for this order. Message us and we&apos;ll cancel it and refund you the same day.
              </div>
            ) : (
              <>
                <p className="mt-5 text-sm font-semibold text-ivory">Why are you cancelling?</p>
                <div className="mt-2 grid gap-2">
                  {REASONS.map((r) => (
                    <button key={r} onClick={() => { setReason(r); setErr(''); }}
                      className={cx('rounded-xl border px-4 py-2.5 text-left text-sm transition',
                        reason === r ? 'border-rose bg-lilacbg/50 font-semibold text-ivory' : 'border-line text-ivory/80 hover:border-rose/40')}>
                      {r}
                    </button>
                  ))}
                </div>
                {reason === 'Other' && (
                  <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={2} placeholder="Tell us a little more (optional)"
                    className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-rose focus-visible:outline-none" />
                )}
              </>
            )}

            {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}

            <div className="mt-5 grid gap-2">
              {prepaidPaid || support ? (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 font-semibold text-white">
                  <MessageCircle size={18} /> WhatsApp us to cancel
                </a>
              ) : (
                <button onClick={submit} disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {busy ? <><Loader2 size={17} className="animate-spin" /> Cancelling…</> : 'Yes, cancel order'}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-full py-3 text-sm font-semibold" style={{ color: accent }}>Keep my order</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
