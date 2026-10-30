'use client';
import { useEffect, useState } from 'react';
import { Bell, Send, Loader2, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminToken } from '@/lib/data';
import { cx } from '@/lib/format';

// Ready-made messages. One tap fills the form; edit before sending.
const PRESETS = [
  { tag: '❄️ Winter', title: '❄️ Winter collection is here!', body: 'Jackets, hoodies & sweatshirts just dropped. Try at your door, pay only for what you keep.', url: '/products' },
  { tag: '🆕 New arrivals', title: '🆕 Fresh drops just landed', body: 'New styles added today in Gwalior. Delivered in minutes — open the app before they sell out.', url: '/products' },
  { tag: '🔁 Back in stock', title: '🔁 Back in stock!', body: 'Your favourites are back. Grab them before they are gone again.', url: '/products' },
  { tag: '🔥 Sale', title: '🔥 Sale is live — up to 60% OFF', body: 'Big savings on kurtis, jeans, tees & more. Delivered in minutes across Gwalior.', url: '/products' },
  { tag: '👗 Women', title: '👗 New in for her', body: 'Kurtis, dresses and jeans you will love. Try first, pay later.', url: '/products?category=women' },
  { tag: '👔 Men', title: '👔 New in for him', body: 'Shirts, tees and denims — delivered in minutes. Try at your door.', url: '/products?category=men' },
];

const LINKS = [
  { v: '/', l: 'Home' },
  { v: '/products', l: 'All products' },
  { v: '/products?category=women', l: 'Women' },
  { v: '/products?category=men', l: 'Men' },
  { v: '/products?category=unisex', l: 'Unisex' },
  { v: '/products?category=ethnic', l: 'Ethnic' },
  { v: '/wishlist', l: 'Wishlist' },
];

const T_MAX = 65;
const B_MAX = 178;

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/products');
  const [info, setInfo] = useState(null);       // { reachable, campaigns, setup? }
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState(null);         // { ok, text }

  const load = async () => {
    try {
      const t = await adminToken();
      const r = await fetch('/api/admin/push', { headers: t ? { Authorization: `Bearer ${t}` } : {}, cache: 'no-store' });
      const j = await r.json();
      setInfo(r.ok ? j : { reachable: 0, campaigns: [], setup: j.error });
    } catch { setInfo({ reachable: 0, campaigns: [], setup: 'Could not load' }); }
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    setBusy(true); setMsg(null);
    try {
      const t = await adminToken();
      const r = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ title, body, url }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not send');
      setMsg({ ok: true, text: `Sent to ${j.sent} phone${j.sent === 1 ? '' : 's'}${j.failed ? ` · ${j.failed} failed` : ''}${j.removed ? ` · ${j.removed} uninstalled removed` : ''}.` });
      setTitle(''); setBody(''); setConfirm(false);
      load();
    } catch (e) { setMsg({ ok: false, text: e.message }); setConfirm(false); }
    setBusy(false);
  };

  const ready = title.trim().length >= 3 && body.trim().length >= 3;
  const reach = info?.reachable ?? 0;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ivory flex items-center gap-2"><Bell size={24} /> Notifications</h1>
          <p className="text-sm text-muted mt-1">Send a push notification to everyone who has the OneT India app.</p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm">
          <span className="text-muted">Reachable phones: </span>
          <span className="font-bold text-ivory">{info ? reach : '…'}</span>
        </div>
      </div>

      {info?.setup && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {info.setup}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* compose */}
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Quick templates</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.tag} type="button" onClick={() => { setTitle(p.title); setBody(p.body); setUrl(p.url); setMsg(null); }}
                className="rounded-full border border-line bg-ink px-3 py-1.5 text-xs font-semibold text-ivory hover:border-violet">
                {p.tag}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="flex justify-between text-xs text-muted"><span>Title</span><span>{title.length}/{T_MAX}</span></span>
            <input value={title} maxLength={T_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="❄️ Winter collection is here!"
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet" />
          </label>

          <label className="mt-4 block">
            <span className="flex justify-between text-xs text-muted"><span>Message</span><span>{body.length}/{B_MAX}</span></span>
            <textarea value={body} maxLength={B_MAX} rows={3} onChange={(e) => setBody(e.target.value)} placeholder="Jackets & hoodies just dropped. Try at your door, pay only for what you keep."
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet resize-none" />
          </label>

          <label className="mt-4 block">
            <span className="text-xs text-muted">When tapped, open</span>
            <select value={url} onChange={(e) => setUrl(e.target.value)}
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet">
              {LINKS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </label>

          {msg && (
            <div className={cx('mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm', msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
              {msg.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />} {msg.text}
            </div>
          )}

          {!confirm ? (
            <button type="button" disabled={!ready || busy || !reach} onClick={() => setConfirm(true)}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose px-6 py-3 font-semibold text-white disabled:opacity-40">
              <Send size={16} /> Send to {reach} phone{reach === 1 ? '' : 's'}
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-rose/40 bg-rose/5 p-4">
              <p className="text-sm text-ivory font-semibold">Send this to {reach} phones now?</p>
              <p className="text-xs text-muted mt-1">It cannot be taken back. Max 5 notifications a day — more makes people uninstall.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={send} disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Yes, send
                </button>
                <button type="button" onClick={() => setConfirm(false)} disabled={busy}
                  className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ivory">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* phone preview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5"><Smartphone size={14} /> Preview</p>
          <div className="rounded-[2rem] bg-gradient-to-b from-[#2E1065] to-[#5B16D4] p-4 pt-8 min-h-[220px]">
            <div className="rounded-2xl bg-white/95 p-3 shadow-lg">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="grid place-items-center w-5 h-5 rounded-md bg-[#7B33FB] text-white text-[10px] font-bold">O</span>
                OneT India · now
              </div>
              <p className="mt-1.5 text-sm font-semibold text-gray-900 leading-snug">{title || 'Your title appears here'}</p>
              <p className="mt-0.5 text-[13px] text-gray-600 leading-snug">{body || 'Your message appears here.'}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">Tip: short title with one emoji, and say what is new + why open now.</p>
        </div>
      </div>

      {/* history */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-ivory">Recently sent</h2>
        <div className="mt-3 rounded-2xl border border-line bg-surface divide-y divide-line">
          {!info ? <p className="p-4 text-sm text-muted">Loading…</p>
            : !info.campaigns.length ? <p className="p-4 text-sm text-muted">Nothing sent yet.</p>
              : info.campaigns.map((c) => (
                <div key={c.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ivory">{c.title}</p>
                    <p className="text-xs text-muted mt-0.5">{c.body}</p>
                  </div>
                  <div className="text-right text-xs text-muted shrink-0">
                    <p><span className="font-bold text-ivory">{c.sent}</span> sent{c.failed ? ` · ${c.failed} failed` : ''}</p>
                    <p>{new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
