'use client';
// "Deliver to" card on the product page with a pincode check, so people
// outside Gwalior know before they add to bag.
import { useEffect, useState } from 'react';
import { MapPin, Clock, Check, X } from 'lucide-react';
import { BRAND, isServiceablePin } from '@/lib/config';
import { cx } from '@/lib/format';

const KEY = 'onet_pin';

export default function PincodeCheck({ accent = '#8C1C13' }) {
  const [pin, setPin] = useState('');
  const [saved, setSaved] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { const p = localStorage.getItem(KEY); if (p) { setSaved(p); setPin(p); } } catch {}
  }, []);

  const check = () => {
    if (!/^\d{6}$/.test(pin)) return;
    setSaved(pin); setEditing(false);
    try { localStorage.setItem(KEY, pin); } catch {}
  };

  const ok = saved && isServiceablePin(saved);
  const showForm = !saved || editing;

  return (
    <div className={cx('mt-5 rounded-xl border bg-surface px-4 py-3', saved && !ok && !editing ? 'border-red-200 bg-red-50/50' : 'border-line')}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${accent}14`, color: accent }}><MapPin size={17} /></span>
        {showForm ? (
          <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); check(); }}>
            <input
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" placeholder="Enter pincode to check delivery" aria-label="Pincode"
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm text-ivory outline-none focus:border-rose focus-visible:outline-none"
            />
            <button type="submit" disabled={pin.length !== 6}
              className="h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: accent }}>
              Check
            </button>
          </form>
        ) : (
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="text-sm leading-tight">
              {ok ? (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-ivory">Delivers to {saved} <Check size={15} className="text-emerald-600" /></p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Clock size={12} /> Delivered in minutes · {BRAND.workingHours}</p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-red-600"><X size={15} /> Not delivering to {saved} yet</p>
                  <p className="mt-0.5 text-xs text-muted">We currently deliver only within {BRAND.city} city.</p>
                </>
              )}
            </div>
            <button onClick={() => setEditing(true)} className="shrink-0 text-xs font-semibold hover:underline" style={{ color: accent }}>Change</button>
          </div>
        )}
      </div>
    </div>
  );
}
