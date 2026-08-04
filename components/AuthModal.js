'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Smartphone, Zap, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { useAuthModal } from '@/lib/auth-modal';
import { sendOtp, verifyOtp, updateName } from '@/lib/user-auth';
import { SUPABASE_READY, BRAND } from '@/lib/config';
import { cx } from '@/lib/format';

export default function AuthModal() {
  const { open, next, closeAuth } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [seconds, setSeconds] = useState(0);

  // reset when opened/closed
  useEffect(() => {
    if (open) { setStep('phone'); setOtp(''); setName(''); setErr(''); setDemoCode(''); }
  }, [open]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  if (!open) return null;

  const send = async () => {
    setErr('');
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return setErr('Enter a valid 10-digit mobile number');
    setBusy(true);
    try {
      const r = await sendOtp(phone.trim());
      if (r.demo) setDemoCode(r.code);
      setStep('otp'); setSeconds(30);
    } catch (e) { setErr(e.message || 'Could not send OTP'); }
    setBusy(false);
  };

  const finishAuth = () => {
    closeAuth();
    if (next && next !== pathname) router.push(next);
  };

  const verify = async () => {
    setErr('');
    if (!/^\d{4,6}$/.test(otp.trim())) return setErr('Enter the code sent to your phone');
    setBusy(true);
    try {
      const u = await verifyOtp(phone.trim(), otp.trim());
      if (!u?.name) { setStep('name'); setBusy(false); return; }
      finishAuth();
    } catch (e) { setErr(e.message || 'Invalid OTP'); setBusy(false); }
  };

  const saveName = async () => {
    setErr('');
    if (name.trim().length < 2) return setErr('Please enter your name');
    setBusy(true);
    try { await updateName(name.trim()); finishAuth(); }
    catch (e) { setErr(e.message || 'Could not save name'); setBusy(false); }
  };

  const resend = async () => {
    if (seconds > 0) return;
    try { const r = await sendOtp(phone.trim()); if (r.demo) setDemoCode(r.code); setSeconds(30); } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-0 sm:p-4"
        onClick={closeAuth}>
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-3xl h-full sm:h-auto overflow-hidden sm:rounded-[1.75rem] shadow-pop grid md:grid-cols-2 bg-[#160B2E]">

          <button onClick={closeAuth} aria-label="Close"
            className="absolute top-4 right-4 z-10 grid place-items-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
            <X size={18} />
          </button>

          {/* LEFT — form */}
          <div className="relative bg-gradient-to-br from-[#2A1256] via-[#241049] to-[#160B2E] text-white p-8 sm:p-10 flex flex-col justify-center">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-grape/30 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl font-extrabold tracking-tight">OneT</span>
                <span className="font-display text-2xl font-extrabold tracking-tight text-[#FF8FC4]">India</span>
              </div>

              {step === 'phone' ? (
                <>
                  <h2 className="mt-6 font-display text-2xl sm:text-3xl font-extrabold leading-tight">Login or Sign up</h2>
                  <p className="mt-2 text-white/60 text-sm">We’ll send an OTP to verify your number.</p>

                  <div className="mt-6 flex items-stretch bg-white/5 rounded-2xl overflow-hidden border-2 border-white/10 focus-within:border-[#FF8FC4]">
                    <span className="flex items-center gap-1 pl-4 pr-3 text-sm font-semibold text-white/90 border-r border-white/10">🇮🇳 +91</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric" placeholder="Enter phone number" autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && send()}
                      className="flex-1 bg-transparent text-white px-4 py-4 text-base outline-none placeholder:text-white/40" />
                  </div>

                  {err && <p className="mt-3 text-sm text-white bg-rose/40 rounded-lg px-3 py-2">{err}</p>}

                  <button onClick={send} disabled={busy}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E5399B] hover:bg-[#d62d8c] text-white px-6 py-4 font-semibold text-lg shadow-glow transition disabled:opacity-60">
                    {busy ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : 'Continue'}
                  </button>
                </>
              ) : step === 'otp' ? (
                <>
                  <button onClick={() => { setStep('phone'); setErr(''); }} className="mt-6 inline-flex items-center gap-1 text-white/70 text-sm hover:text-white">
                    <ArrowLeft size={15} /> Change number
                  </button>
                  <h2 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold leading-tight">Verify your number</h2>
                  <p className="mt-2 text-white/60 text-sm">Enter the code sent to <span className="text-white font-medium">+91 {phone}</span></p>

                  {demoCode && (
                    <p className="mt-3 text-sm text-white bg-white/10 rounded-lg px-3 py-2">
                      Demo OTP: <span className="font-bold tracking-widest">{demoCode}</span> (real SMS starts once an SMS provider is added)
                    </p>
                  )}

                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric" placeholder="• • • • • •" autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                    className="mt-5 w-full bg-white/5 border-2 border-white/10 focus:border-[#FF8FC4] rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none placeholder:text-white/30" />

                  {err && <p className="mt-3 text-sm text-white bg-rose/40 rounded-lg px-3 py-2">{err}</p>}

                  <button onClick={verify} disabled={busy}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E5399B] hover:bg-[#d62d8c] text-white px-6 py-4 font-semibold text-lg shadow-glow transition disabled:opacity-60">
                    {busy ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : 'Verify & continue'}
                  </button>

                  <p className="mt-4 text-center text-sm text-white/60">
                    {seconds > 0 ? `Resend code in ${seconds}s` : <button onClick={resend} className="text-[#FF8FC4] font-semibold hover:underline">Resend OTP</button>}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-6 font-display text-2xl sm:text-3xl font-extrabold leading-tight">What’s your name?</h2>
                  <p className="mt-2 text-white/60 text-sm">So we know who we’re delivering to.</p>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    className="mt-5 w-full bg-white/5 border-2 border-white/10 focus:border-[#FF8FC4] rounded-2xl px-4 py-4 text-base text-white outline-none placeholder:text-white/40" />
                  {err && <p className="mt-3 text-sm text-white bg-rose/40 rounded-lg px-3 py-2">{err}</p>}
                  <button onClick={saveName} disabled={busy}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E5399B] hover:bg-[#d62d8c] text-white px-6 py-4 font-semibold text-lg shadow-glow transition disabled:opacity-60">
                    {busy ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : 'Continue'}
                  </button>
                </>
              )}

              <p className="mt-6 text-center text-xs text-white/45">
                By continuing you agree to our{' '}
                <Link href="/terms" onClick={closeAuth} className="text-white/70 underline">Terms</Link> &amp;{' '}
                <Link href="/privacy-policy" onClick={closeAuth} className="text-white/70 underline">Privacy Policy</Link>
              </p>
            </div>
          </div>

          {/* RIGHT — dark decorative (hidden on mobile) */}
          <div className="hidden md:flex flex-col items-center justify-center text-center bg-[#1E1140] p-10">
            <div className="relative">
              <div className="w-24 h-40 rounded-[1.4rem] bg-gradient-to-br from-grape to-plum shadow-pop grid place-items-center">
                <Smartphone size={48} className="text-white/90" />
              </div>
              <span className="absolute -right-3 -top-3 grid place-items-center w-9 h-9 rounded-full bg-[#E5399B] text-white shadow-glow">
                <Zap size={16} className="fill-white" />
              </span>
            </div>
            <h3 className="mt-6 font-display text-xl font-extrabold text-white leading-tight">Order faster &amp;<br />easier everytime</h3>
            <p className="mt-2 text-sm text-white/50">Fashion at your door across {BRAND.city}.</p>
            <div className="mt-6 w-full max-w-xs space-y-2.5">
              {[
                { icon: Truck, t: `~${BRAND.etaMinutes} min delivery` },
                { icon: ShieldCheck, t: 'Try before you pay' },
                { icon: Zap, t: `₹0 delivery over ₹${BRAND.freeDeliveryAbove}` },
              ].map(({ icon: I, t }) => (
                <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-[#FF8FC4] shrink-0"><I size={17} /></span>
                  <span className="text-sm font-medium text-white/90">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}