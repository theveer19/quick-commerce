'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, User, MapPin, Headphones, LogOut, ChevronRight, ShoppingBag, Check, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getCurrentUser, signOutUser, updateName } from '@/lib/user-auth';
import { useAuthModal } from '@/lib/auth-modal';
import { fetchMyOrders, STAGE_LABEL } from '@/lib/data';
import { listAddresses, addAddress, deleteAddress } from '@/lib/addresses';
import { inr, cx } from '@/lib/format';
import { BRAND } from '@/lib/config';

const TABS = [
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'support', label: 'Customer Support', icon: Headphones },
  { key: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { key: 'profile', label: 'Profile', icon: User },
];

const badge = (s) =>
  s === 'delivered' ? 'bg-mint/15 text-mint'
  : s === 'cancelled' ? 'bg-rose/15 text-rose'
  : s === 'out_for_delivery' ? 'bg-violet/20 text-grape'
  : 'bg-lemon text-lemon-ink';

export default function AccountPage() {
  const router = useRouter();
  const openAuth = useAuthModal((s) => s.openAuth);
  const [state, setState] = useState('loading'); // loading | guest | ready
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('orders');
  const [showMenuMobile, setShowMenuMobile] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      if (!u) { setState('guest'); return; }
      setUser(u);
      setOrders(await fetchMyOrders());
      setState('ready');
    };
    load();
    const onAuth = () => load();
    window.addEventListener('onet-auth', onAuth);
    return () => window.removeEventListener('onet-auth', onAuth);
  }, []);

  const logout = async () => { await signOutUser(); router.push('/'); };
  const pick = (k) => { setTab(k); setShowMenuMobile(false); };

  if (state === 'loading') return <div className="mx-auto max-w-5xl px-4 py-20 text-muted">Loading…</div>;

  if (state === 'guest') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-lilacbg text-grape mx-auto"><User size={28} /></div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ivory">Login to your account</h1>
        <p className="mt-2 text-muted">See your orders, addresses and profile.</p>
        <button onClick={() => openAuth('/account')} className="mt-6 inline-flex rounded-full bg-rose text-white px-7 py-3.5 font-semibold shadow-glow">Login</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid md:grid-cols-[300px_1fr] gap-5">
        {/* SIDEBAR */}
        <aside className={cx('rounded-xl2 border border-line bg-white shadow-soft overflow-hidden h-max', !showMenuMobile && 'hidden md:block')}>
          <div className="p-5 flex items-center gap-3 border-b border-line">
            <span className="grid place-items-center w-14 h-14 rounded-full bg-lilacbg text-grape shrink-0"><User size={26} /></span>
            <div className="min-w-0">
              <p className="font-display font-bold text-ivory text-lg truncate">{user?.name || 'Add your name'}</p>
              <p className="text-sm text-muted">{user?.phone ? `+91 ${user.phone}` : 'Signed in'}</p>
            </div>
          </div>
          <nav className="p-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => pick(t.key)}
                className={cx('w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors',
                  tab === t.key ? 'bg-lilacbg text-grape font-semibold' : 'text-ivory hover:bg-lilacbg/60')}>
                <t.icon size={20} /> <span className="flex-1">{t.label}</span>
                <ChevronRight size={16} className="text-muted" />
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-line">
            <button onClick={logout} className="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-rose/40 text-rose font-semibold py-2.5 hover:bg-rose/5 transition">
              <LogOut size={18} /> Log Out
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <section className={cx('rounded-xl2 border border-line bg-surface-2 shadow-soft min-h-[420px]', showMenuMobile && 'hidden md:block')}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-line bg-white rounded-t-xl2">
            <button onClick={() => setShowMenuMobile(true)} className="md:hidden text-muted"><ArrowLeft size={18} /></button>
            <h1 className="font-display text-lg font-bold text-ivory">{TABS.find((t) => t.key === tab)?.label}</h1>
          </div>

          <div className="p-5">
            {tab === 'orders' && (
              orders.length === 0 ? (
                <Empty icon={ShoppingBag} title="No orders yet" sub="When you place an order it’ll show up here." cta />
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <Link key={o.code} href={`/order/${o.code}`}
                      className="group flex items-center gap-4 rounded-xl border border-line bg-white shadow-soft hover:shadow-card transition-all p-4">
                      <span className="grid place-items-center w-11 h-11 rounded-xl bg-lilacbg text-grape shrink-0"><Package size={20} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-ivory">{o.code}</span>
                          <span className={cx('text-[11px] font-semibold px-2 py-0.5 rounded-full', badge(o.status))}>{STAGE_LABEL[o.status] || o.status}</span>
                        </div>
                        <p className="text-sm text-muted mt-0.5 truncate">
                          {o.items?.length} item{o.items?.length > 1 ? 's' : ''} · {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="font-display font-bold text-ivory">{inr(o.total)}</span>
                      <ChevronRight size={18} className="text-muted" />
                    </Link>
                  ))}
                </div>
              )
            )}

            {tab === 'profile' && <ProfileForm user={user} />}

            {tab === 'addresses' && <AddressesTab />}

            {tab === 'support' && (
              <div className="max-w-md">
                <p className="text-muted">Need help with an order or something else? We’re here for you.</p>
                <div className="mt-4 space-y-3">
                  <a href={`tel:${BRAND.phone}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-soft hover:shadow-card transition">
                    <Headphones size={18} className="text-grape" /> <span className="text-ivory font-medium">Call us: {BRAND.phone}</span>
                  </a>
                  <Link href="/help" className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-soft hover:shadow-card transition">
                    <ChevronRight size={18} className="text-grape" /> <span className="text-ivory font-medium">Help &amp; FAQs</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async () => {
    if (name.trim().length < 2) return;
    setBusy(true); setSaved(false);
    try { await updateName(name.trim()); setSaved(true); setTimeout(() => setSaved(false), 1500); } catch {}
    setBusy(false);
  };
  return (
    <div className="max-w-md space-y-4">
      <label className="block">
        <span className="text-sm text-muted">Full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="mt-1 w-full bg-white border border-line rounded-xl px-4 py-3 text-sm text-ivory outline-none focus:border-violet" />
      </label>
      <label className="block">
        <span className="text-sm text-muted">Mobile number</span>
        <input value={user?.phone ? `+91 ${user.phone}` : ''} disabled
          className="mt-1 w-full bg-ink border border-line rounded-xl px-4 py-3 text-sm text-muted outline-none" />
      </label>
      <button onClick={save} disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-rose text-white px-6 py-3 font-semibold shadow-glow disabled:opacity-60">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : saved ? <><Check size={16} /> Saved</> : 'Save changes'}
      </button>
    </div>
  );
}

function Empty({ icon: Icon, title, sub, cta }) {
  return (
    <div className="py-14 text-center">
      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-lilacbg text-grape mx-auto"><Icon size={24} /></div>
      <p className="mt-4 font-display text-lg font-semibold text-ivory">{title}</p>
      <p className="text-muted text-sm mt-1">{sub}</p>
      {cta && <Link href="/products" className="mt-5 inline-flex rounded-full bg-rose text-white px-6 py-3 font-semibold">Browse products</Link>}
    </div>
  );
}

function AddressesTab() {
  const [list, setList] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: 'Home', line: '', landmark: '', pincode: '', city: 'Gwalior' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => listAddresses().then(setList);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErr('');
    if (form.line.trim().length < 6) return setErr('Enter your full address');
    if (!/^\d{6}$/.test(form.pincode.trim())) return setErr('Enter a valid 6-digit pincode');
    setBusy(true);
    try {
      await addAddress({ label: form.label, line: form.line.trim(), landmark: form.landmark.trim() || null, pincode: form.pincode.trim(), city: form.city, is_default: (list || []).length === 0 });
      setForm({ label: 'Home', line: '', landmark: '', pincode: '', city: 'Gwalior' });
      setAdding(false); await load();
    } catch (e) { setErr(e.message || 'Could not save'); }
    setBusy(false);
  };
  const remove = async (id) => { await deleteAddress(id); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">Your saved delivery addresses.</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-full bg-rose text-white px-4 py-2 text-sm font-semibold shadow-glow">
            <Plus size={16} /> Add address
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-xl border border-line bg-white p-4 shadow-soft mb-4 space-y-3">
          <div className="flex gap-2">
            {['Home', 'Work', 'Other'].map((l) => (
              <button key={l} onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={cx('rounded-full px-3 py-1 text-sm border', form.label === l ? 'bg-lilacbg border-violet text-grape' : 'border-line text-muted')}>{l}</button>
            ))}
          </div>
          <input value={form.line} onChange={set('line')} placeholder="House / Flat, Street, Area"
            className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.landmark} onChange={set('landmark')} placeholder="Landmark (optional)"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
            <input value={form.pincode} onChange={set('pincode')} inputMode="numeric" placeholder="Pincode"
              className="w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
          </div>
          {err && <p className="text-sm text-rose">{err}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="rounded-full bg-rose text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy ? 'Saving…' : 'Save address'}
            </button>
            <button onClick={() => { setAdding(false); setErr(''); }} className="rounded-full border border-line px-5 py-2.5 text-sm text-muted">Cancel</button>
          </div>
        </div>
      )}

      {!list ? <p className="text-muted text-sm">Loading…</p> :
        list.length === 0 && !adding ? (
          <Empty icon={MapPin} title="No saved addresses" sub="Add an address for faster checkout." />
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-white p-4 shadow-soft flex items-start gap-3">
                <MapPin size={18} className="text-grape mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ivory">{a.label || 'Address'}{a.is_default ? ' · Default' : ''}</p>
                  <p className="text-sm text-muted">{a.line}{a.landmark ? `, ${a.landmark}` : ''}, {a.city} - {a.pincode}</p>
                </div>
                <button onClick={() => remove(a.id)} className="text-muted hover:text-rose p-1" aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}