'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { inr } from '@/lib/format';
import { BRAND } from '@/lib/config';

// Razorpay Checkout needs a browser, and the Android app does not ship the
// native SDK. So the app opens this page, the customer pays here, and we send
// them straight back into the app with a deep link. The order was already
// created and priced on the server — this page only pays for it, and can never
// change what is owed.

const MAROON = '#8C1C13';
const PURPLE = '#7B33FB';

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

export default function PayPage() {
  const { code } = useParams();
  const [state, setState] = useState('loading'); // loading | ready | paying | paid | error
  const [session, setSession] = useState(null);
  const [err, setErr] = useState('');
  const opened = useRef(false);

  const backToApp = `onetindia://order/${code}`;

  const load = useCallback(async () => {
    setState('loading'); setErr('');
    try {
      const r = await fetch(`/api/razorpay/session/${encodeURIComponent(code)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Order not found');
      setSession(j);
      if (j.paid) { setState('paid'); return; }
      if (!j.prepaid) throw new Error('This order is Try & Buy — there is nothing to pay now.');
      if (!j.razorpay_order_id || !j.key_id) throw new Error('Payment is not available for this order.');
      setState('ready');
    } catch (e) {
      setErr(e.message || 'Something went wrong'); setState('error');
    }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const pay = useCallback(async () => {
    if (!session || state === 'paying') return;
    setState('paying'); setErr('');
    const ok = await loadRazorpay();
    if (!ok) { setErr('Could not reach Razorpay. Check your connection.'); setState('ready'); return; }

    const rzp = new window.Razorpay({
      key: session.key_id,
      amount: session.amount,
      currency: 'INR',
      name: BRAND.name,
      description: `Order ${session.code}`,
      order_id: session.razorpay_order_id,
      theme: { color: MAROON },
      handler: async (r) => {
        try {
          const vr = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...r, code: session.code }),
          });
          const vd = await vr.json();
          if (!vd.verified) throw new Error('We could not verify that payment. Please contact support.');
          setState('paid');
          // Straight back into the app. If the deep link does not resolve (the
          // page was opened in a plain browser), the button below still works.
          setTimeout(() => { window.location.href = backToApp; }, 600);
        } catch (e) {
          setErr(e.message || 'Could not confirm the payment'); setState('ready');
        }
      },
      modal: { ondismiss: () => setState('ready') },
    });
    rzp.on('payment.failed', () => { setErr('Payment failed. Please try again.'); setState('ready'); });
    rzp.open();
  }, [session, state, backToApp]);

  // Open the sheet by itself the first time, so the customer does not have to
  // tap twice after already tapping "Pay" in the app.
  useEffect(() => {
    if (state === 'ready' && !opened.current) { opened.current = true; pay(); }
  }, [state, pay]);

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#F6F3FF]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_12px_40px_rgba(46,16,101,0.10)]">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-[#1A1033]">
            One<span style={{ color: PURPLE }}>T</span>
          </span>
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#7C7696] mt-2">INDIA</span>
        </div>

        {state === 'loading' && (
          <p className="mt-6 text-sm text-[#7C7696]">Opening your payment…</p>
        )}

        {state === 'paid' && (
          <>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F8F0] text-2xl">✓</div>
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-[#1A1033]">Payment received</h1>
            <p className="mt-1 text-sm text-[#7C7696]">
              Order {code} is confirmed{session?.total ? ` · ${inr(session.total)}` : ''}. We are packing it now.
            </p>
            <a
              href={backToApp}
              className="mt-6 block rounded-full px-5 py-3 text-center text-sm font-bold text-white"
              style={{ background: PURPLE }}
            >
              Back to the app
            </a>
          </>
        )}

        {(state === 'ready' || state === 'paying') && (
          <>
            <h1 className="mt-6 text-xl font-extrabold tracking-tight text-[#1A1033]">
              Pay {session ? inr(session.total) : ''}
            </h1>
            <p className="mt-1 text-sm text-[#7C7696]">Order {code} · secured by Razorpay</p>
            {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
            <button
              onClick={pay}
              disabled={state === 'paying'}
              className="mt-6 w-full rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: MAROON }}
            >
              {state === 'paying' ? 'Opening Razorpay…' : 'Pay now'}
            </button>
            <a href={backToApp} className="mt-3 block text-center text-xs font-semibold text-[#7C7696]">
              Cancel and go back
            </a>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="mt-6 text-xl font-extrabold tracking-tight text-[#1A1033]">Cannot open payment</h1>
            <p className="mt-1 text-sm text-[#7C7696]">{err}</p>
            <button
              onClick={load}
              className="mt-6 w-full rounded-full px-5 py-3 text-sm font-bold text-white"
              style={{ background: PURPLE }}
            >
              Try again
            </button>
            <a href={backToApp} className="mt-3 block text-center text-xs font-semibold text-[#7C7696]">
              Back to the app
            </a>
          </>
        )}
      </div>
    </main>
  );
}
