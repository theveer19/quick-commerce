'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Check, Gift, Tag, Truck, ShieldCheck, Sparkles, ArrowRight, Flame, TrendingUp } from 'lucide-react';

const OFFERS = [
  { code: 'FREEDOM', title: 'Independence Day Sale', desc: 'Up to 60% OFF + extra ₹150 off your first order.', badge: '60% OFF', grad: 'from-[#FF9933] via-grape to-indiagreen', icon: Sparkles, tri: true },
  { code: 'WELCOME100', title: 'First Order ₹100 OFF', desc: 'New here? Flat ₹100 off your first order above ₹499.', badge: '₹100 OFF', grad: 'from-grape to-plum', icon: Gift },
  { code: 'SAVE500', title: 'Spend ₹500, Save ₹100', desc: 'Flat ₹100 off on orders above ₹500.', badge: '₹100 OFF', grad: 'from-[#0EA5A0] to-indiagreen', icon: Tag },
  { code: 'SAVE1000', title: 'Spend ₹1000, Save ₹200', desc: 'Flat ₹200 off on orders above ₹1000.', badge: '₹200 OFF', grad: 'from-fashionpink to-plum', icon: Flame },
];

const PERKS = [
  { icon: Truck, title: '₹0 Delivery', desc: 'Free on orders above ₹999' },
  { icon: ShieldCheck, title: 'Try & Buy', desc: 'Pay only for what you keep' },
];

const TIERS = [
  { spend: '₹500', save: '₹100', pct: 40 },
  { spend: '₹1000', save: '₹200', pct: 70 },
  { spend: '₹2000', save: '₹500', pct: 100 },
];

export default function OffersPage() {
  const [copied, setCopied] = useState('');
  const copy = async (code) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1500); } catch {}
  };

  return (
    <div className="relative overflow-hidden">
      {/* animated background blobs */}
      <div className="pointer-events-none absolute -top-20 -right-10 w-72 h-72 rounded-full bg-violet/30 blur-3xl animate-float" aria-hidden />
      <div className="pointer-events-none absolute top-40 -left-16 w-72 h-72 rounded-full bg-fashionpink/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {/* hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lilacbg text-grape px-4 py-1.5 text-sm font-semibold"><Sparkles size={14} /> Live offers & deals</span>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-ivory">Save big on every <span className="text-gradient">drop</span></h1>
          <p className="mt-3 text-muted max-w-lg mx-auto">Grab these deals before they’re gone. Copy a code and use it at checkout.</p>
        </motion.div>

        {/* offer cards */}
        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {OFFERS.map((o, i) => (
            <motion.div key={o.code}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${o.grad} p-7 text-white shadow-card`}>
              {o.tri && <div className="absolute top-0 left-0 right-0 h-1.5 flex"><span className="flex-1 bg-[#FF9933]" /><span className="flex-1 bg-white" /><span className="flex-1 bg-indiagreen" /></div>}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden />

              <div className="relative flex items-start justify-between">
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur"><o.icon size={26} /></span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{o.badge}</span>
              </div>

              <h3 className="relative mt-5 font-display text-2xl font-extrabold">{o.title}</h3>
              <p className="relative mt-1.5 text-white/85 text-sm">{o.desc}</p>

              <div className="relative mt-6 flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between rounded-xl border-2 border-dashed border-white/40 bg-white/10 px-4 py-2.5">
                  <span className="font-display font-bold tracking-widest">{o.code}</span>
                  <button onClick={() => copy(o.code)} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80">
                    {copied === o.code ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
                  </button>
                </div>
                <Link href="/products" className="grid place-items-center w-11 h-11 rounded-xl bg-white text-plum shrink-0 hover:scale-105 transition-transform"><ArrowRight size={18} /></Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* tiers — the more you shop, the more you save */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-14 rounded-[1.75rem] border border-line bg-surface p-7 sm:p-10 shadow-soft">
          <div className="flex items-center gap-2 text-grape"><TrendingUp size={18} /><span className="font-semibold">Shop more, save more</span></div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-ivory">The bigger your bag, the bigger the savings</h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {TIERS.map((t, i) => (
              <motion.div key={t.spend} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-lilacbg p-5">
                <p className="text-sm text-muted">Spend</p>
                <p className="font-display text-2xl font-extrabold text-ivory">{t.spend}</p>
                <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${t.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }} className="h-full bg-gradient-to-r from-grape to-rose" />
                </div>
                <p className="mt-3 font-semibold text-mint">Save {t.save}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* perks */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {PERKS.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-lilacbg text-grape"><p.icon size={22} /></span>
              <div><p className="font-display font-bold text-ivory">{p.title}</p><p className="text-sm text-muted">{p.desc}</p></div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-8 py-4 font-semibold shadow-glow hover:bg-plum transition-colors">
            Start shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}