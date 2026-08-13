'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Loader2 } from 'lucide-react';
import { BRAND } from '@/lib/config';
import { inr } from '@/lib/format';

export default function InvoicePage() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders/${code}`);
        if (!res.ok) throw new Error();
        setOrder(await res.json()); setState('ready');
      } catch { setState('error'); }
    })();
  }, [code]);

  if (state === 'loading') return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted"><Loader2 className="animate-spin inline" /> Loading invoice…</div>;
  if (state === 'error' || !order) return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted">Invoice not found.</div>;

  const items = order.items || [];
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const delivery = Math.max(0, (order.total || subtotal) - subtotal);
  const a = order.address || {};
  const date = new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* toolbar (hidden on print) */}
      <div className="print:hidden flex justify-between items-center mb-4">
        <h1 className="font-display text-xl font-bold text-ivory">Invoice · {order.code}</h1>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-5 py-2.5 font-semibold shadow-glow">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white rounded-xl2 border border-line shadow-soft overflow-hidden print:shadow-none print:border-0">
        {/* header */}
        <div className="bg-brand-gradient text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-display text-3xl font-extrabold">OneT <span className="text-softpink">India</span></div>
              <p className="text-white/80 text-sm mt-1">First Try. Then Buy.</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-lg">TAX INVOICE</p>
              <p className="text-white/80">{order.code}</p>
              <p className="text-white/80">{date}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* parties */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted font-semibold">Billed by</p>
              <p className="font-semibold text-ivory mt-1">{BRAND.name}</p>
              <p className="text-sm text-muted">{BRAND.city}, Madhya Pradesh, India</p>
              <p className="text-sm text-muted">{BRAND.phone}{BRAND.email ? ` · ${BRAND.email}` : ''}</p>
              {BRAND.gstin && <p className="text-sm text-muted">GSTIN: {BRAND.gstin}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted font-semibold">Billed to</p>
              <p className="font-semibold text-ivory mt-1">{order.customer?.name || '—'}</p>
              <p className="text-sm text-muted">{order.customer?.phone}</p>
              <p className="text-sm text-muted">{[a.line, a.landmark, a.city, a.pincode].filter(Boolean).join(', ')}</p>
            </div>
          </div>

          {/* items */}
          <table className="w-full mt-8 text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left text-muted">
                <th className="py-2 font-semibold">Item</th>
                <th className="py-2 font-semibold text-center">Qty</th>
                <th className="py-2 font-semibold text-right">Price</th>
                <th className="py-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-3 text-ivory">{it.name}{it.size ? ` · ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''}</td>
                  <td className="py-3 text-center text-muted">{it.qty}</td>
                  <td className="py-3 text-right text-muted">{inr(it.price)}</td>
                  <td className="py-3 text-right text-ivory font-medium">{inr(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-ivory">{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="text-ivory">{delivery === 0 ? 'Free' : inr(delivery)}</span></div>
              <div className="flex justify-between border-t-2 border-line pt-2 font-bold text-base"><span className="text-ivory">Total</span><span className="text-rose">{inr(order.total || subtotal + delivery)}</span></div>
              <p className="text-xs text-muted pt-1">Payment: {order.payment_method === 'tryandbuy' ? 'Try & Buy (pay at door)' : order.payment_status === 'paid' ? 'Paid online' : 'Pending'}</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-line text-center">
            <p className="text-sm text-ivory font-semibold">Thank you for shopping with OneT India 💜</p>
            <p className="text-xs text-muted mt-1">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}