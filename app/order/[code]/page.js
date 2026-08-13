'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, MapPin, Phone, PartyPopper, Truck, FileText } from 'lucide-react';
import { fetchOrder, ORDER_STAGES, STAGE_LABEL } from '@/lib/data';
import MapTracker from '@/components/MapTracker';
import { inr } from '@/lib/format';
import { BRAND } from '@/lib/config';

export default function OrderPage() {
  const { code } = useParams();
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    let alive = true;
    const load = () => fetchOrder(code).then((o) => { if (alive) setOrder(o); });
    load();
    const t = setInterval(load, 8000); // live refresh
    return () => { alive = false; clearInterval(t); };
  }, [code]);

  if (order === undefined) return <div className="mx-auto max-w-3xl px-4 py-20 text-muted">Loading…</div>;
  if (order === null) return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-ivory">Order not found</h1>
      <p className="text-muted mt-2">Check your order code and try again.</p>
      <Link href="/track" className="mt-4 inline-block text-rose hover:underline">Track another order</Link>
    </div>
  );

  const stage = order.status === 'cancelled' ? -1 : ORDER_STAGES.indexOf(order.status);
  const done = order.status === 'delivered';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {order.payment_status?.startsWith('paid') && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2 rounded-xl bg-mint/10 border border-mint/30 text-mint px-4 py-3 text-sm">
          <PartyPopper size={18} /> Payment successful. Your order is confirmed!
        </motion.div>
      )}

      {order.status !== 'cancelled' && (
        <div className="mb-6">
          <MapTracker status={order.status} etaMinutes={BRAND.etaMinutes} rider={order.rider} />
        </div>
      )}

      {order.delivery_partner?.phone && order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="mb-6 rounded-xl2 border border-line bg-surface p-4 flex items-center gap-3">
          <span className="grid place-items-center w-12 h-12 rounded-full bg-lilacbg text-rose shrink-0"><Truck size={22} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Your delivery partner</p>
            <p className="font-display font-bold text-ivory">{order.delivery_partner.name || 'On the way'}</p>
          </div>
          <a href={`tel:${order.delivery_partner.phone}`} className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-5 py-2.5 font-semibold shadow-glow">
            <Phone size={16} /> Call
          </a>
        </div>
      )}

      <div className="rounded-xl2 border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted">Order</p>
            <h1 className="font-display text-2xl font-bold text-ivory">{order.code}</h1>
            <a href={`/invoice/${order.code}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-grape hover:bg-lilacbg">
              <FileText size={14} /> View / download bill
            </a>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Arriving in</p>
            <p className="font-display text-2xl font-bold text-rose">~{BRAND.etaMinutes} min</p>
          </div>
        </div>

        {/* timeline */}
        <div className="mt-8">
          {order.status === 'cancelled' ? (
            <p className="text-rose font-medium">This order was cancelled.</p>
          ) : (
            <div className="space-y-0">
              {ORDER_STAGES.map((s, i) => {
                const active = i <= stage;
                const current = i === stage;
                return (
                  <div key={s} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{ scale: current ? [1, 1.15, 1] : 1 }}
                        transition={{ repeat: current && !done ? Infinity : 0, duration: 1.6 }}
                        className={`grid place-items-center w-9 h-9 rounded-full border-2 ${active ? 'bg-rose border-rose text-white' : 'border-line text-muted'}`}>
                        {active ? <Check size={16} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                      </motion.div>
                      {i < ORDER_STAGES.length - 1 && (
                        <div className={`w-0.5 h-10 ${i < stage ? 'bg-rose' : 'bg-line'}`} />
                      )}
                    </div>
                    <div className="pb-8 pt-1">
                      <p className={`font-medium ${active ? 'text-ivory' : 'text-muted'}`}>{STAGE_LABEL[s]}</p>
                      {current && <p className="text-xs text-rose mt-0.5">In progress…</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* details */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-line bg-surface p-5">
          <h3 className="font-display font-semibold text-ivory mb-3">Delivery to</h3>
          <p className="text-sm text-ivory">{order.customer?.name}</p>
          <p className="text-sm text-muted mt-1 flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> {order.address?.line}, {order.address?.landmark && order.address.landmark + ', '}{order.address?.city} - {order.address?.pincode}</p>
          <p className="text-sm text-muted mt-1 flex items-center gap-2"><Phone size={14} /> {order.customer?.phone}</p>
        </div>
        <div className="rounded-xl2 border border-line bg-surface p-5">
          <h3 className="font-display font-semibold text-ivory mb-3">Payment</h3>
          <p className="text-sm text-muted">{order.payment_method === 'razorpay' ? 'Prepaid (Razorpay)' : 'Try & Buy — pay at door'}</p>
          <p className="text-sm text-muted mt-1">Status: <span className="text-ivory">{order.payment_status}</span></p>
        </div>
      </div>

      {/* items */}
      <div className="mt-6 rounded-xl2 border border-line bg-surface p-5">
        <h3 className="font-display font-semibold text-ivory mb-3">Items</h3>
        <div className="space-y-2">
          {order.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted">{it.name}{it.size ? ` · ${it.size}` : ""}{it.color ? ` · ${it.color}` : ""} × {it.qty}</span>
              <span className="text-ivory">{inr(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="border-t border-line pt-2 mt-2 flex justify-between font-display font-bold text-ivory">
            <span>Total</span><span>{inr(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link href="/products" className="text-sm text-rose hover:underline">Continue shopping →</Link>
      </div>
    </div>
  );
}