'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, MapPin, Phone, PartyPopper, FileText } from 'lucide-react';
import { fetchOrder, ORDER_STAGES, STAGE_LABEL } from '@/lib/data';
import MapTracker from '@/components/MapTracker';
import { inr } from '@/lib/format';
import { BRAND } from '@/lib/config';

const MAROON = '#8C1C13';

// Live ETA: counts down from (order time + promised minutes). Never sticks at
// a flat "~30 min" — once the window passes it shows "Arriving soon".
function etaInfo(order) {
  if (order.status === 'delivered') return { label: 'Status', value: 'Delivered', chip: 'Delivered', done: true };
  if (order.status === 'cancelled') return { label: 'Status', value: 'Cancelled', chip: 'Cancelled', done: true };
  const created = new Date(order.created_at).getTime();
  if (!created || isNaN(created)) return { label: 'Arriving in', value: `~${BRAND.etaMinutes} min`, chip: `Arriving in ~${BRAND.etaMinutes} min` };
  const remainMin = Math.round((created + BRAND.etaMinutes * 60000 - Date.now()) / 60000);
  if (remainMin >= 1) return { label: 'Arriving in', value: `~${remainMin} min`, chip: `Arriving in ~${remainMin} min` };
  return { label: 'Arriving', value: 'Soon', chip: 'Arriving soon' };
}

export default function OrderPage() {
  const { code } = useParams();
  const [order, setOrder] = useState(undefined);
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => fetchOrder(code).then((o) => { if (alive) setOrder(o); });
    load();
    const t = setInterval(load, 6000); // live refresh
    const c = setInterval(() => setTick((n) => n + 1), 30000); // ETA countdown re-render
    return () => { alive = false; clearInterval(t); clearInterval(c); };
  }, [code]);

  if (order === undefined) return <div className="mx-auto max-w-3xl px-4 py-20 text-muted">Loading…</div>;
  if (order === null) return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-ivory">Order not found</h1>
      <p className="text-muted mt-2">Check your order code and try again.</p>
      <Link href="/track" className="mt-4 inline-block font-semibold hover:underline" style={{ color: MAROON }}>Track another order</Link>
    </div>
  );

  const stage = order.status === 'cancelled' ? -1 : ORDER_STAGES.indexOf(order.status);
  const done = order.status === 'delivered';
  const paid = order.payment_status?.startsWith('paid');
  const eta = etaInfo(order);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {paid && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm font-medium">
          <PartyPopper size={18} /> Payment successful. Your order is confirmed!
        </motion.div>
      )}

      {order.status !== 'cancelled' && (
        <div className="mb-6">
          <MapTracker status={order.status} etaText={eta.chip} rider={order.delivery_partner} />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-muted">Order</p>
            <h1 className="font-display text-2xl font-bold text-ivory">{order.code}</h1>
            <a href={`/invoice/${order.code}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-lilacbg" style={{ color: MAROON }}>
              <FileText size={14} /> View / download bill
            </a>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">{eta.label}</p>
            <p className="font-display text-2xl font-bold" style={{ color: MAROON }}>{eta.value}</p>
          </div>
        </div>

        {/* timeline */}
        <div className="mt-8">
          {order.status === 'cancelled' ? (
            <p className="font-medium" style={{ color: MAROON }}>This order was cancelled.</p>
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
                        className="grid place-items-center w-9 h-9 rounded-full border-2"
                        style={active ? { backgroundColor: MAROON, borderColor: MAROON, color: '#fff' } : { borderColor: '#E7E2F0', color: '#9A93AC' }}>
                        {active ? <Check size={16} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                      </motion.div>
                      {i < ORDER_STAGES.length - 1 && (
                        <div className="w-0.5 h-10" style={{ backgroundColor: i < stage ? MAROON : '#E7E2F0' }} />
                      )}
                    </div>
                    <div className="pb-8 pt-1">
                      <p className={`font-semibold ${active ? 'text-ivory' : 'text-muted'}`}>{STAGE_LABEL[s]}</p>
                      {current && !done && <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: MAROON }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: MAROON }} /> In progress…</p>}
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
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ivory mb-3">Delivery to</h3>
          <p className="text-sm text-ivory font-medium">{order.customer?.name}</p>
          <p className="text-sm text-muted mt-1 flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" style={{ color: MAROON }} /> {order.address?.line}, {order.address?.landmark && order.address.landmark + ', '}{order.address?.city} - {order.address?.pincode}</p>
          <p className="text-sm text-muted mt-1 flex items-center gap-2"><Phone size={14} style={{ color: MAROON }} /> {order.customer?.phone}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <h3 className="font-display font-semibold text-ivory mb-3">Payment</h3>
          <p className="text-sm text-muted">{order.payment_method === 'razorpay' ? (paid ? 'Prepaid (Razorpay) — Paid' : 'Prepaid (Razorpay) — Payment pending') : 'Try & Buy — pay at door'}</p>
          <p className="text-sm text-muted mt-1">Status: <span className={cx_paid(paid)}>{order.payment_status}</span></p>
        </div>
      </div>

      {/* items */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-soft">
        <h3 className="font-display font-semibold text-ivory mb-3">Items</h3>
        <div className="space-y-2">
          {order.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted">{it.name}{it.size ? ` · ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''} × {it.qty}</span>
              <span className="text-ivory font-medium">{inr(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="border-t border-line pt-2 mt-2 flex justify-between font-display font-bold text-ivory">
            <span>Total</span><span>{inr(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Link href="/products" className="text-sm font-semibold hover:underline" style={{ color: MAROON }}>Continue shopping →</Link>
      </div>
    </div>
  );
}

function cx_paid(paid) {
  return paid ? 'text-emerald-600 font-semibold' : 'text-ivory';
}
