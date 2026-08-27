'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, Truck, Loader2, MapPin, Navigation, Check } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { placeOrder, markPaidLocal } from '@/lib/data';
import { getCurrentUser } from '@/lib/user-auth';
import { listAddresses } from '@/lib/addresses';
import { useAuthModal } from '@/lib/auth-modal';
import { inr, orderCode, cx } from '@/lib/format';
import { BRAND, RAZORPAY_KEY_ID } from '@/lib/config';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const openAuth = useAuthModal((s) => s.openAuth);
  const [savedAddrs, setSavedAddrs] = useState([]);
  const [form, setForm] = useState(empty);
  const [method, setMethod] = useState('tryandbuy');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (!err) return; const t = setTimeout(() => setErr(''), 4000); return () => clearTimeout(t); }, [err]);
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [geo, setGeo] = useState(null); // {lat, lng}
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoErr, setGeoErr] = useState('');

  // Auto-capture GPS silently (best-effort) so delivery still gets a pin when allowed
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const pinLocation = () => {
    setGeoErr('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeoErr('Location not supported on this device'); return; }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoBusy(false); },
      () => { setGeoErr('Could not get location. Please allow location access.'); setGeoBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
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
        <h1 className="font-display text-2xl font-bold text-ivory">Login to checkout</h1>
        <p className="mt-2 text-muted">Please sign in with your phone number to place your order.</p>
        <button onClick={() => openAuth('/checkout')} className="mt-6 inline-flex rounded-full bg-rose text-white px-7 py-3.5 font-semibold shadow-glow">Login to continue</button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-ivory">Nothing to checkout</h1>
        <button onClick={() => router.push('/products')} className="mt-4 text-rose hover:underline">Browse products</button>
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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) return 'Please enter your delivery address';
    if (!/^\d{6}$/.test(form.pincode.trim())) return 'Enter a valid 6-digit pincode';
    return '';
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

  const submit = async () => {
    const v = validate(); if (v) return setErr(v);
    setErr(''); setBusy(true);
    try {
      if (method === 'razorpay') await loadRazorpay();

      // server computes price + creates the order (and Razorpay order if prepaid)
      const data = await placeOrder(buildPayload());

      if (method === 'tryandbuy') { finish(data.code); return; }

      const rp = data.razorpay;
      // no real gateway configured yet -> complete the demo flow
      if (!rp || rp.demo || !RAZORPAY_KEY_ID) {
        if (!data.persisted) markPaidLocal(data.code, 'demo');
        finish(data.code); return;
      }

      const rzp = new window.Razorpay({
        key: rp.keyId,
        amount: rp.amount,        // amount comes from the server, not the client
        currency: 'INR',
        name: BRAND.name,
        description: 'Fashion order',
        order_id: rp.orderId,
        prefill: { name: form.name, contact: form.phone },
        theme: { color: '#7A46F5' },
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
          } catch (e) { setErr(e.message); setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', () => { setErr('Payment failed. Please try again.'); setBusy(false); });
      rzp.open();
    } catch (e) { setErr(e.message || 'Something went wrong'); setBusy(false); }
  };

  return (
    <>
      {err && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-[92%] w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-rose text-white text-sm font-medium px-4 py-3 shadow-glow animate-[fadeIn_.2s_ease]">
            <span className="shrink-0">⚠️</span>
            <span>{err}</span>
            <button onClick={() => setErr('')} className="ml-2 text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ivory mb-8">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* address */}
          <section className="rounded-xl2 border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-ivory mb-4">Delivery address</h2>

            {savedAddrs.length > 0 && (
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {savedAddrs.map((a) => (
                  <button key={a.id} type="button"
                    onClick={() => setForm((f) => ({ ...f, address: a.line, landmark: a.landmark || '', pincode: a.pincode }))}
                    className="text-left rounded-xl border border-line bg-white hover:border-rose p-3 shadow-soft transition">
                    <span className="text-sm font-semibold text-ivory">{a.label || 'Address'}</span>
                    <span className="block text-xs text-muted truncate">{a.line}, {a.city} - {a.pincode}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={form.name} onChange={set('name')} full />
              <Field label="Mobile number" value={form.phone} onChange={set('phone')} placeholder="10-digit" inputMode="numeric" />
              <Field label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="474001" inputMode="numeric" />
              <Field label="Address (house, street, area)" value={form.address} onChange={set('address')} full />
              <Field label="Landmark (optional)" value={form.landmark} onChange={set('landmark')} />
              <Field label="Delivery notes (optional)" value={form.notes} onChange={set('notes')} />
            </div>
          </section>

          {/* payment */}
          <section className="rounded-xl2 border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-semibold text-ivory mb-4">Payment</h2>
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
        <div className="lg:sticky lg:top-24 h-fit rounded-xl2 border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-ivory">Summary</h2>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {items.map((i) => (
              <div key={i.key} className="flex justify-between text-sm">
                <span className="text-muted truncate mr-2">{i.name}{i.size ? ` · ${i.size}` : ""}{i.color ? ` · ${i.color}` : ""} × {i.qty}</span>
                <span className="text-ivory shrink-0">{inr(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-ivory">{inr(sub)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Delivery</span><span className={delivery === 0 ? 'text-mint' : 'text-ivory'}>{delivery === 0 ? 'Free' : inr(delivery)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount {appliedCode ? `(${appliedCode})` : ''}</span><span className="text-mint">-{inr(discount)}</span></div>}

            {/* coupon */}
            <div className="pt-2">
              {appliedCode ? (
                <button onClick={removeCoupon} className="text-xs font-semibold text-rose underline">Remove coupon</button>
              ) : (
                <div className="flex gap-2">
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code"
                    className="flex-1 bg-white border border-line rounded-lg px-3 py-2 text-sm text-ivory outline-none focus:border-violet uppercase" />
                  <button onClick={applyCoupon} disabled={couponBusy} className="rounded-lg bg-rose text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">{couponBusy ? '…' : 'Apply'}</button>
                </div>
              )}
              {couponMsg && <p className={`mt-1.5 text-xs ${discount > 0 ? 'text-mint' : 'text-rose'}`}>{couponMsg}</p>}
            </div>

            <div className="flex justify-between font-display text-lg font-bold text-ivory pt-2 border-t border-line"><span>Total</span><span>{inr(total)}</span></div>
          </div>



          <button onClick={submit} disabled={busy}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose text-white px-6 py-3.5 font-semibold shadow-glow hover:brightness-110 transition-all disabled:opacity-60">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> :
              method === 'razorpay' ? `Pay ${inr(total)}` : 'Place order'}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} /> {method === 'razorpay' ? 'Secured by Razorpay' : 'No payment until you try'}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

function Field({ label, full, ...props }) {
  return (
    <label className={cx('block', full && 'sm:col-span-2')}>
      <span className="text-xs text-muted">{label}</span>
      <input {...props}
        className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
    </label>
  );
}

function PayOption({ active, onClick, icon: Icon, title, desc, badge }) {
  return (
    <button onClick={onClick}
      className={cx('w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-colors',
        active ? 'border-rose bg-rose/5' : 'border-line hover:border-white/20')}>
      <span className={cx('grid place-items-center w-10 h-10 rounded-full shrink-0', active ? 'bg-rose text-white' : 'bg-lilacbg text-muted')}><Icon size={18} /></span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium text-ivory" dangerouslySetInnerHTML={{ __html: title }} />
          {badge && <span className="text-[10px] font-bold uppercase tracking-wide bg-mint/20 text-mint px-2 py-0.5 rounded-full">{badge}</span>}
        </span>
        <span className="block text-sm text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: desc }} />
      </span>
      <span className={cx('mt-1 w-4 h-4 rounded-full border-2 shrink-0', active ? 'border-rose bg-rose' : 'border-line')} />
    </button>
  );
}