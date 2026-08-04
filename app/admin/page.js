'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IndianRupee, ShoppingCart, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { adminListOrders, adminListProducts, STAGE_LABEL } from '@/lib/data';
import { inr } from '@/lib/format';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminListOrders(), adminListProducts()])
      .then(([o, p]) => { setOrders(o); setProducts(p); })
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders.reduce((a, o) => a + (o.total || 0), 0);
  const pending = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;

  const cards = [
    { label: 'Revenue', value: inr(revenue), icon: IndianRupee, color: 'text-mint' },
    { label: 'Total orders', value: orders.length, icon: ShoppingCart, color: 'text-rose' },
    { label: 'Active pending', value: pending, icon: TrendingUp, color: 'text-violet' },
    { label: 'Low stock items', value: lowStock, icon: AlertTriangle, color: 'text-rose' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ivory">Dashboard</h1>
      <p className="text-muted text-sm mt-1">Overview of your store.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{c.label}</span>
              <c.icon size={18} className={c.color} />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-ivory">{loading ? '—' : c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl2 border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-display font-semibold text-ivory">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-rose hover:underline">View all →</Link>
        </div>
        {loading ? (
          <p className="p-5 text-muted text-sm">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-muted text-sm">No orders yet. Orders placed on the store appear here.</p>
        ) : (
          <div className="divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <Link key={o.code} href="/admin/orders" className="flex items-center justify-between p-4 hover:bg-lilacbg">
                <div>
                  <p className="text-sm font-medium text-ivory">{o.code}</p>
                  <p className="text-xs text-muted">{o.customer?.name} · {o.items?.length} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ivory">{inr(o.total)}</p>
                  <p className="text-xs text-muted">{STAGE_LABEL[o.status] || o.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
