'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, ShoppingCart, Clock, AlertTriangle, TrendingUp, Package, XCircle, ArrowRight } from 'lucide-react';
import { adminListOrders, adminListProducts, STAGE_LABEL } from '@/lib/data';
import { inr, cx } from '@/lib/format';

const DAY = 864e5;
const LOW = 2;
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const live = (o) => o.status !== 'cancelled';
const sum = (list) => list.reduce((a, o) => a + (Number(o.total) || 0), 0);

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, p]) => { setOrders(o || []); setProducts(p || []); })
      .finally(() => setLoading(false));
  }, []);

  const s = useMemo(() => {
    const today = startOfDay();
    const at = (o) => new Date(o.created_at).getTime() || 0;
    const todayO = orders.filter((o) => at(o) >= today);
    const yestO = orders.filter((o) => at(o) >= today - DAY && at(o) < today);
    const weekO = orders.filter((o) => at(o) >= today - 6 * DAY);
    const monthO = orders.filter((o) => at(o) >= today - 29 * DAY);
    const liveAll = orders.filter(live);

    // last 7 days, oldest → newest
    const days = Array.from({ length: 7 }, (_, i) => {
      const from = today - (6 - i) * DAY;
      const list = orders.filter((o) => live(o) && at(o) >= from && at(o) < from + DAY);
      return { from, revenue: sum(list), count: list.length };
    });

    // best sellers in the last 30 days (by pieces)
    const sold = new Map();
    monthO.filter(live).forEach((o) => (o.items || []).forEach((it) => {
      const k = String(it.id || it.name);
      const cur = sold.get(k) || { name: it.name, image: it.image, qty: 0, revenue: 0 };
      cur.qty += Number(it.qty) || 0;
      cur.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
      sold.set(k, cur);
    }));
    const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    const low = products.filter((p) => p.is_active !== false && (Number(p.stock) || 0) <= LOW)
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));

    return {
      todayRev: sum(todayO.filter(live)), todayCount: todayO.filter(live).length,
      yestRev: sum(yestO.filter(live)),
      weekRev: sum(weekO.filter(live)), weekCount: weekO.filter(live).length,
      aov: liveAll.length ? Math.round(sum(liveAll) / liveAll.length) : 0,
      allRev: sum(liveAll),
      pending: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      cancelRate: monthO.length ? Math.round((monthO.filter((o) => o.status === 'cancelled').length / monthO.length) * 100) : 0,
      days, top, low,
    };
  }, [orders, products]);

  const delta = s.yestRev ? Math.round(((s.todayRev - s.yestRev) / s.yestRev) * 100) : null;
  const maxDay = Math.max(1, ...s.days.map((d) => d.revenue));

  const cards = [
    { label: "Today's sales", value: inr(s.todayRev), sub: `${s.todayCount} order${s.todayCount === 1 ? '' : 's'}${delta !== null ? ` · ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs yesterday` : ''}`, icon: IndianRupee, color: 'text-mint' },
    { label: 'Last 7 days', value: inr(s.weekRev), sub: `${s.weekCount} orders`, icon: TrendingUp, color: 'text-violet' },
    { label: 'Need action', value: s.pending, sub: 'not delivered yet', icon: Clock, color: 'text-rose', href: '/admin/orders' },
    { label: 'Avg order value', value: inr(s.aov), sub: `${inr(s.allRev)} all-time`, icon: ShoppingCart, color: 'text-grape' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ivory">Dashboard</h1>
      <p className="text-muted text-sm mt-1">Your store at a glance. Cancelled orders are not counted in sales.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{c.label}</span>
                <c.icon size={18} className={c.color} />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-ivory">{loading ? '—' : c.value}</div>
              <div className="mt-1 text-xs text-muted">{loading ? '' : c.sub}</div>
            </>
          );
          return c.href
            ? <Link key={c.label} href={c.href} className="rounded-xl2 border border-line bg-surface p-5 hover:border-rose/40">{body}</Link>
            : <div key={c.label} className="rounded-xl2 border border-line bg-surface p-5">{body}</div>;
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* 7-day chart */}
        <div className="rounded-xl2 border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ivory">Sales — last 7 days</h2>
            <span className="text-xs text-muted">{s.cancelRate}% cancelled (30 days)</span>
          </div>
          <div className="mt-5 flex h-44 items-end gap-2 sm:gap-3">
            {s.days.map((d) => {
              const label = new Date(d.from).toLocaleDateString('en-IN', { weekday: 'short' });
              const h = Math.max(3, Math.round((d.revenue / maxDay) * 100));
              return (
                <div key={d.from} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-semibold text-ivory/70 opacity-0 transition group-hover:opacity-100">{inr(d.revenue)}</span>
                  <div className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-plum to-violet transition-all" style={{ height: `${h}%` }} title={`${d.count} orders · ${inr(d.revenue)}`} />
                  <span className="text-[11px] text-muted">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* low stock */}
        <div className="rounded-xl2 border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display font-semibold text-ivory"><AlertTriangle size={16} className="text-rose" /> Low stock</h2>
            <Link href="/admin/inventory" className="text-xs text-rose hover:underline">Inventory →</Link>
          </div>
          {loading ? <p className="mt-4 text-sm text-muted">Loading…</p> : s.low.length === 0 ? (
            <p className="mt-4 text-sm text-muted">All good — nothing at {LOW} or fewer pieces.</p>
          ) : (
            <ul className="mt-3 max-h-48 divide-y divide-line overflow-y-auto">
              {s.low.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate text-ivory">{p.name}</span>
                  <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', Number(p.stock) <= 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700')}>
                    {Number(p.stock) <= 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* best sellers */}
        <div className="rounded-xl2 border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold text-ivory"><Package size={16} className="text-grape" /> Best sellers — 30 days</h2>
          {s.top.length === 0 ? <p className="mt-4 text-sm text-muted">{loading ? 'Loading…' : 'No sales in the last 30 days yet.'}</p> : (
            <ul className="mt-3 divide-y divide-line">
              {s.top.map((t, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 text-center text-sm font-bold text-muted">{i + 1}</span>
                  {t.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={t.image} alt="" className="h-11 w-9 rounded-md object-cover" />
                    : <div className="h-11 w-9 rounded-md bg-cloud" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-ivory">{t.name}</span>
                  <span className="text-right text-xs text-muted"><b className="block text-sm text-ivory">{t.qty} sold</b>{inr(t.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* recent orders */}
        <div className="rounded-xl2 border border-line bg-surface overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <h2 className="font-display font-semibold text-ivory">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-rose hover:underline">View all <ArrowRight size={14} /></Link>
          </div>
          {loading ? <p className="p-5 text-muted text-sm">Loading…</p> : orders.length === 0 ? (
            <p className="p-8 text-center text-muted text-sm">No orders yet. Orders placed on the store appear here.</p>
          ) : (
            <div className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <Link key={o.code} href="/admin/orders" className="flex items-center justify-between p-4 hover:bg-lilacbg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ivory">{o.code}</p>
                    <p className="truncate text-xs text-muted">{o.customer?.name} · {o.items?.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className={cx('text-sm font-medium', o.status === 'cancelled' ? 'text-muted line-through' : 'text-ivory')}>{inr(o.total)}</p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted">{o.status === 'cancelled' && <XCircle size={11} className="text-red-500" />}{STAGE_LABEL[o.status] || o.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
