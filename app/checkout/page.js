'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, Truck, Loader2, Check, AlertCircle, User, Phone, MapPin, Hash, Lock, Tag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { placeOrder, markPaidLocal } from '@/lib/data';
import { getCurrentUser } from '@/lib/user-auth';
import { listAddresses } from '@/lib/addresses';
import { useAuthModal } from '@/lib/auth-modal';
import { inr, orderCode, cx } from '@/lib/format';
import { BRAND, RAZORPAY_KEY_ID } from '@/lib/config';

const MAROON = '#8C1C13';
const MAROON_DARK = '#6E140D';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const empty = { name: '', phone: '', address: '', landmark: '', pincode: '', notes: '' };

// Field validation rules — each returns an error string or '' when valid.
const RULES = {
  name: (v) => (!v.trim() ? 'Please enter your full name' : ''),
  phone: (v) => (!v.trim() ? 'Please enter your mobile number' : !/^[6-9]\d{9}$/.test(v.trim()) ? 'Enter a valid 10-digit mobile number' : ''),
  pincode: (v) => (!v.trim() ? 'Please enter your pincode' : !/^\d{6}$/.test(v.trim()) ? 'Enter a valid 6-digit pincode' : ''),
  address: (v) => (!v.trim() ? 'Please enter your full delivery address' : v.trim().length < 10 ? 'Address looks too short — add house, street & area' : ''),
};
const FIELD_ORDER = ['name', 'phone', 'pincode', 'address'];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const openAuth = useAuthModal((s) => s.openAuth);
  const [savedAddrs, setSavedAddrs] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [method, setMethod] = useState('tryandbuy');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (!err) return; const t = setTimeout(() => setErr(''), 5000); return () => clearTimeout(t); }, [err]);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [geo, setGeo] = useState(null); // {lat, lng}

  // Auto-capture GPS silently (best-effort) so delivery still gets a pin when allowed
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    const check = async () => {
      const u = await getCurrentUser();
      if (!u) { setAuthChecked(false); openAuth('/checkout'); return; }
      setForm((f) => ({ ...f, name: f.name || u.name || '', phone: f.phone || u.phone || '' }));
      try { setSavedAddrs(await listAddresses()); } catch {}
      setAuthChecked(true);
    };
    check();
    const onAuth = () => check();
    window.addEventListener('onet-auth', onAuth);
    return () => window.removeEventListener('onet-auth', onAuth);
  }, [openAuth]);

  if (!mounted) return <div className="mx-auto max-w-6xl px-4 py-20 text-muted">Loading…</div>;
  if (!authChecked) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto grid place-items-center w-14 h-14 rounded-2xl" style={{ backgroundColor: `${MAROON}14`, color: MAROON }}><Lock size={24} /></span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ivory">Login to checkout</h1>
        <p className="mt-2 text-muted">Sign in with your phone number to place your order securely.</p>
        <button onClick={() => openAuth('/checkout')} className="mt-6 inline-flex rounded-full text-white px-7 py-3.5 font-semibold" style={{ backgroundColor: MAROON, boxShadow: `0 8px 22px ${MAROON}44` }}>Login to continue</button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-ivory">Nothing to checkout</h1>
        <button onClick={() => router.push('/products')} className="mt-4 font-semibold hover:underline" style={{ color: MAROON }}>Browse products</button>
      </div>
    );
  }

  const sub = subtotal();
  const delivery = sub >= BRAND.freeDeliveryAbove ? 0 : BRAND.deliveryFee;
  const total = Math.max(0, sub + delivery - discount);

  const applyCoupon = async () => {
    setCouponMsg('');
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      const res = await fetch('/api/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: coupon.trim(), subtotal: sub }) });
      const j = await res.json();
      if (j.valid) { setDiscount(j.discount); setAppliedCode(j.code); setCouponMsg(`✓ ${j.message}`); }
      else { setDiscount(0); setAppliedCode(''); setCouponMsg(j.message || 'Invalid coupon'); }
    } catch { setCouponMsg('Could not check coupon'); }
    setCouponBusy(false);
  };
  const removeCoupon = () => { setCoupon(''); setDiscount(0); setAppliedCode(''); setCouponMsg(''); };

  // controlled change — re-validate live once a field has been touched
  const set = (k) => (e) => {
    let val = e.target.value;
    if (k === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    if (k === 'pincode') val = val.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({ ...f, [k]: val }));
    if (touched[k] && RULES[k]) setErrors((er) => ({ ...er, [k]: RULES[k](val) }));
  };
  const blur = (k) => () => {
    if (!RULES[k]) return;
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: RULES[k](form[k] || '') }));
  };

  const validateAll = () => {
    const er = {};
    for (const k in RULES) { const m = RULES[k](form[k] || ''); if (m) er[k] = m; }
    return er;
  };

  const buildPayload = () => ({
    items: items.map((i) => ({ id: i.id, size: i.size, color: i.color, qty: i.qty })),
    customer: { name: form.name.trim(), phone: form.phone.trim() },
    address: {
      line: form.address.trim(),
      landmark: form.landmark.trim(),
      pincode: form.pincode.trim(),
      notes: form.notes.trim(),
      city: BRAND.city,
      lat: geo?.lat || null,
      lng: geo?.lng || null,
    },
    payment_method: method,
    coupon: appliedCode || null,
  });

  const finish = (code) => { clear(); router.push(`/order/${code}`); };

  const showError = (msg) => {
    setErr(msg);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    const er = validateAll();
    setErrors(er);
    setTouched({ name: true, phone: true, pincode: true, address: true });
    if (Object.keys(er).length) {
      showError('Please fill the highlighted fields to continue');
      const first = FIELD_ORDER.find((k) => er[k]);
      if (first && typeof document !== 'undefined') {
        const el = document.getElementById(`fld-${first}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el?.focus(), 300);
      }
      return;
    }
    setErr(''); setBusy(true);
    try {
      if (method === 'razorpay') await loadRazorpay();
      const data = await placeOrder(buildPayload());
      if (method === 'tryandbuy') { finish(data.code); return; }

      const rp = data.razorpay;
      if (!rp || rp.demo || !RAZORPAY_KEY_ID) {
        if (!data.persisted) markPaidLocal(data.code, 'demo');
        finish(data.code); return;
      }

      const rzp = new window.Razorpay({
        key: rp.keyId,
        amount: rp.amount,
        currency: 'INR',
        name: BRAND.name,
        description: 'Fashion order',
        order_id: rp.orderId,
        prefill: { name: form.name, contact: form.phone },
        theme: { color: MAROON },
        handler: async (r) => {
          try {
            const vr = await fetch('/api/razorpay/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...r, code: data.code }),
            });
            const vd = await vr.json();
            if (!vd.verified) throw new Error('Payment verification failed');
            if (!data.persisted) markPaidLocal(data.code, r.razorpay_payment_id);
            finish(data.code);
          } catch (e) { showError(e.message || 'Could not place order'); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', () => { showError('Payment failed. Please try again.'); setBusy(false); });
      rzp.open();
    } catch (e) { showError(e.message || 'Something went wrong'); setBusy(false); }
  };

  const invalidCount = Object.keys(validateAll()).length;

  return (
    <>
      {err && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-[92%] w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-red-600 text-white text-sm font-medium px-4 py-3 shadow-lg animate-[fadeIn_.2s_ease]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{err}</span>
            <button onClick={() => setErr('')} className="ml-2 text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-7">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ivory">Secure checkout</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Lock size={13} /> Your details are safe. Delivering in {BRAND.city}.</p>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* address */}
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-soft">
              <SectionHeader n={1} title="Delivery details" />

              {savedAddrs.length > 0 && (
                <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
                  {savedAddrs.map((a) => (
                    <button key={a.id} type="button"
                      onClick={() => { setForm((f) => ({ ...f, address: a.line, landmark: a.landmark || '', pincode: a.pincode })); setErrors((er) => ({ ...er, address: '', pincode: '' })); }}
                      className="text-left rounded-xl border p-3 transition"
                      style={{ borderColor: '#E7E2F0' }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = MAROON)}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E7E2F0')}>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ivory"><MapPin size={13} style={{ color: MAROON }} /> {a.label || 'Saved address'}</span>
                      <span className="block text-xs text-muted truncate mt-0.5">{a.line}, {a.city} - {a.pincode}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <Field name="name" label="Full name" required icon={User} value={form.name}
                  onChange={set('name')} onBlur={blur('name')} error={errors.name} placeholder="e.g. Aman Shivhare" full />
                <Field name="phone" label="Mobile number" required icon={Phone} value={form.phone}
                  onChange={set('phone')} onBlur={blur('phone')} error={errors.phone}
                  placeholder="10-digit mobile" inputMode="numeric" hint="We'll send delivery updates here" />
                <Field name="pincode" label="Pincode" required icon={Hash} value={form.pincode}
                  onChange={set('pincode')} onBlur={blur('pincode')} error={errors.pincode}
                  placeholder="474001" inputMode="numeric" />
                <Field name="address" label="Address (house, street, area)" required icon={MapPin} value={form.address}
                  onChange={set('address')} onBlur={blur('address')} error={errors.address}
                  placeholder="House / flat no., street, locality" full textarea />
                <Field name="landmark" label="Landmark" optional value={form.landmark}
                  onChange={set('landmark')} placeholder="Near…" />
                <Field name="notes" label="Delivery notes" optional value={form.notes}
                  onChange={set('notes')} placeholder="Ring the bell, call on arrival…" />
              </div>
            </section>

            {/* payment */}
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-soft">
              <SectionHeader n={2} title="Payment method" />
              <div className="space-y-3">
                <PayOption
                  active={method === 'tryandbuy'} onClick={() => setMethod('tryandbuy')}
                  icon={Truck} title="Try &amp; Buy (pay at door)"
                  desc="Try everything, pay only for what you keep — UPI/cash at delivery." badge="Recommended" />
                <PayOption
                  active={method === 'razorpay'} onClick={() => setMethod('razorpay')}
                  icon={Wallet} title="Pay now — UPI / Card / Netbanking"
                  desc="Secure prepaid checkout via Razorpay." />
              </div>
            </section>
          </div>

          {/* summary */}
          <div className="lg:sticky lg:top-24 h-fit rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-ivory">Order summary</h2>
            <div className="mt-4 space-y-2.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
              {items.map((i) => (
                <div key={i.key} className="flex justify-between gap-2 text-sm">
                  <span className="text-muted truncate">{i.name}{i.size ? ` · ${i.size}` : ''}{i.color ? ` · ${i.color}` : ''} <span className="text-ivory/70">× {i.qty}</span></span>
                  <span className="text-ivory font-medium shrink-0">{inr(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-ivory">{inr(sub)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Delivery</span><span className={delivery === 0 ? 'text-emerald-600 font-semibold' : 'text-ivory'}>{delivery === 0 ? 'FREE' : inr(delivery)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount {appliedCode ? `(${appliedCode})` : ''}</span><span className="text-emerald-600 font-semibold">-{inr(discount)}</span></div>}

              {/* coupon */}
              <div className="pt-1">
                {appliedCode ? (
                  <button onClick={removeCoupon} className="text-xs font-semibold underline" style={{ color: MAROON }}>Remove coupon</button>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code"
                        className="w-full bg-cloud border border-line rounded-xl pl-9 pr-3 py-2.5 text-sm text-ivory uppercase outline-none focus:border-[#8C1C13]" />
                    </div>
                    <button onClick={applyCoupon} disabled={couponBusy} className="rounded-xl text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: MAROON }}>{couponBusy ? '…' : 'Apply'}</button>
                  </div>
                )}
                {couponMsg && <p className={cx('mt-1.5 text-xs font-medium', discount > 0 ? 'text-emerald-600' : 'text-red-600')}>{couponMsg}</p>}
              </div>

              <div className="flex justify-between font-display text-xl font-bold text-ivory pt-3 border-t border-line"><span>Total</span><span>{inr(total)}</span></div>
            </div>

            <button onClick={submit} disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full text-white px-6 py-4 font-semibold transition-all active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: MAROON, boxShadow: `0 10px 24px ${MAROON}44` }}>
              {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> :
                method === 'razorpay' ? `Pay ${inr(total)}` : `Place order · ${inr(total)}`}
            </button>

            {invalidCount > 0 && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={12} /> {invalidCount} detail{invalidCount > 1 ? 's' : ''} left to fill
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {[[ShieldCheck, 'Secure'], [Truck, `~${BRAND.etaMinutes} min`], [Check, 'Easy returns']].map(([Icon, label]) => (
                <div key={label} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={16} style={{ color: MAROON }} />
                  <span className="text-[10px] font-medium text-muted">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Lock size={12} /> {method === 'razorpay' ? 'Secured by Razorpay' : 'No payment until you try'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({ n, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="grid place-items-center w-7 h-7 rounded-full text-white text-sm font-bold shrink-0" style={{ backgroundColor: MAROON }}>{n}</span>
      <h2 className="font-display text-lg font-semibold text-ivory">{title}</h2>
    </div>
  );
}

function Field({ label, name, full, error, required, optional, hint, icon: Icon, textarea, ...props }) {
  const invalid = !!error;
  const base = 'mt-1.5 w-full bg-white rounded-xl text-sm text-ivory placeholder:text-muted/60 outline-none transition-colors border';
  const pad = Icon && !textarea ? 'pl-10 pr-3.5 py-3' : 'px-3.5 py-3';
  return (
    <label className={cx('block', full && 'sm:col-span-2')}>
      <span className="flex items-center gap-1 text-[13px] font-semibold text-ivory">
        {label}
        {required && <span style={{ color: MAROON }}>*</span>}
        {optional && <span className="text-muted font-normal">(optional)</span>}
      </span>
      <div className="relative">
        {Icon && !textarea && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: invalid ? '#DC2626' : '#9A93AC' }} />}
        {textarea ? (
          <textarea id={`fld-${name}`} rows={2} aria-invalid={invalid} {...props}
            className={cx(base, 'px-3.5 py-3 resize-none', invalid ? 'border-red-400 bg-red-50/50' : 'border-line focus:border-[#8C1C13]')}
            style={invalid ? { boxShadow: '0 0 0 3px rgba(220,38,38,0.10)' } : undefined} />
        ) : (
          <input id={`fld-${name}`} aria-invalid={invalid} {...props}
            className={cx(base, pad, invalid ? 'border-red-400 bg-red-50/50' : 'border-line focus:border-[#8C1C13]')}
            style={invalid ? { boxShadow: '0 0 0 3px rgba(220,38,38,0.10)' } : undefined} />
        )}
      </div>
      {invalid ? (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle size={12} className="shrink-0" /> {error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

function PayOption({ active, onClick, icon: Icon, title, desc, badge }) {
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-colors"
      style={active ? { borderColor: MAROON, backgroundColor: `${MAROON}0A` } : { borderColor: '#E7E2F0' }}>
      <span className="grid place-items-center w-10 h-10 rounded-full shrink-0 text-white" style={{ backgroundColor: active ? MAROON : '#C9C2D8' }}><Icon size={18} /></span>
      <span className="flex-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ivory" dangerouslySetInnerHTML={{ __html: title }} />
          {badge && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{badge}</span>}
        </span>
        <span className="block text-sm text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: desc }} />
      </span>
      <span className="mt-1 w-5 h-5 rounded-full border-2 shrink-0 grid place-items-center" style={{ borderColor: active ? MAROON : '#C9C2D8' }}>
        {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MAROON }} />}
      </span>
    </button>
  );
}
