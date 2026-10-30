'use client';
// Login / sign-up popup — phone → OTP → name.
// Rendered once in the root layout and opened from anywhere via useAuthModal().
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, ArrowRight, Pencil, Lock, Check, AlertCircle,
  Zap, ShieldCheck, RotateCcw, MapPin,
} from 'lucide-react';
import { useAuthModal } from '@/lib/auth-modal';
import { sendOtp, verifyOtp, updateName } from '@/lib/user-auth';
import { BRAND } from '@/lib/config';
import { cx } from '@/lib/format';

const RESEND_SECONDS = 30;
const STEPS = ['phone', 'otp', 'name'];

const fmtPhone = (d) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
const cleanPhone = (v) => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);   // pasted "+91 98…"
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1);    // pasted "098…"
  return d.slice(0, 10);
};

// Drawn flag — the 🇮🇳 emoji shows up as the letters "IN" on Windows.
function IndiaFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-[14px] w-[21px] rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" aria-hidden="true">
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.8" />
    </svg>
  );
}

const PERKS = [
  { icon: Zap, title: 'Delivery in minutes', text: `Across ${BRAND.city}, ${BRAND.workingHours}` },
  { icon: ShieldCheck, title: 'Try before you pay', text: 'Check the fit at your door, pay for what you keep' },
  { icon: RotateCcw, title: 'Same-day exchange', text: "Didn't fit? We'll swap it the same day" },
];

export default function AuthModal() {
  const { open, next, closeAuth } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState('phone'); // phone | otp | name | done
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [errKey, setErrKey] = useState(0);   // re-triggers the shake
  const [seconds, setSeconds] = useState(0);
  const otpRef = useRef(null);
  const verifying = useRef(false);

  const fail = (m) => { setErr(m); setErrKey((k) => k + 1); };
  const phoneOk = /^[6-9]\d{9}$/.test(phone);

  // reset each time it opens
  useEffect(() => {
    if (!open) return;
    setStep('phone'); setOtp(''); setName(''); setErr(''); setDemoCode(''); setBusy(false);
    verifying.current = false;
  }, [open]);

  // lock page scroll + Esc to close
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeAuth(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, closeAuth]);

  // resend countdown
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // Android Chrome can read the OTP straight from the SMS (Web OTP API).
  useEffect(() => {
    if (!open || step !== 'otp' || typeof window === 'undefined' || !('OTPCredential' in window)) return undefined;
    const ac = new AbortController();
    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((c) => { if (c?.code) setOtp(String(c.code).replace(/\D/g, '').slice(0, 6)); })
      .catch(() => {});
    return () => ac.abort();
  }, [open, step]);

  const finishAuth = useCallback(() => {
    setStep('done');
    setTimeout(() => {
      closeAuth();
      if (next && next !== pathname) router.push(next);
    }, 900);
  }, [closeAuth, next, pathname, router]);

  const send = async () => {
    setErr('');
    if (!phoneOk) return fail('Enter a valid 10-digit mobile number');
    setBusy(true);
    try {
      const r = await sendOtp(phone);
      setDemoCode(r.demo ? r.code : '');
      setOtp(''); setStep('otp'); setSeconds(RESEND_SECONDS);
      setTimeout(() => otpRef.current?.focus(), 250);
    } catch (e) { fail(e.message || 'Could not send OTP. Please try again.'); }
    setBusy(false);
  };

  const verify = useCallback(async (code) => {
    if (verifying.current) return;
    setErr('');
    if (!/^\d{6}$/.test(code)) return fail('Enter the 6-digit code');
    verifying.current = true; setBusy(true);
    try {
      const u = await verifyOtp(phone, code);
      setBusy(false); verifying.current = false;
      if (!u?.name) { setStep('name'); return; }
      setName(u.name);
      finishAuth();
    } catch (e) {
      setBusy(false); verifying.current = false;
      setOtp('');
      fail(e.message || 'That code didn’t work. Try again.');
      otpRef.current?.focus();
    }
  }, [phone, finishAuth]);

  // auto-submit once all 6 digits are in (typed, pasted or auto-filled)
  useEffect(() => {
    if (step === 'otp' && otp.length === 6) verify(otp);
  }, [otp, step, verify]);

  const resend = async () => {
    if (seconds > 0 || busy) return;
    setErr('');
    try {
      const r = await sendOtp(phone);
      setDemoCode(r.demo ? r.code : '');
      setSeconds(RESEND_SECONDS); setOtp(''); otpRef.current?.focus();
    } catch (e) { fail(e.message || 'Could not resend. Please try again.'); }
  };

  const saveName = async () => {
    setErr('');
    const n = name.trim().replace(/\s+/g, ' ');
    if (n.length < 2) return fail('Please enter your name');
    if (n.length > 60) return fail('That name is a bit long');
    setBusy(true);
    try { await updateName(n); setName(n); setBusy(false); finishAuth(); }
    catch (e) { setBusy(false); fail(e.message || 'Could not save your name'); }
  };

  if (!open) return null;

  const stepIndex = Math.min(STEPS.indexOf(step === 'done' ? 'name' : step), 2);
  const first = name.trim().split(/\s+/)[0];

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0F0A1F]/60 backdrop-blur-[6px] sm:items-center sm:p-4"
        onClick={closeAuth}
      >
        <motion.div
          role="dialog" aria-modal="true" aria-labelledby="auth-title"
          initial={{ y: 40, opacity: 0, scale: 0.985 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-h-[100dvh] overflow-y-auto rounded-t-[28px] bg-white shadow-[0_40px_120px_-30px_rgba(15,10,31,0.55)] sm:max-w-[920px] sm:rounded-[28px] md:grid md:grid-cols-[1fr_1.08fr] md:overflow-hidden"
        >
          {/* ════════ LEFT — brand panel (tablet / laptop) ════════ */}
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#26076A_0%,#4A13B5_55%,#7B33FB_100%)] p-9 text-white md:flex">
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-fashionpink/25 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-violet/40 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]" />

            <div className="relative">
              <div className="flex items-center gap-1.5 font-display text-[22px] font-extrabold tracking-tight">
                OneT <span className="text-[#C4B5FD]">India</span>
              </div>
              <h3 className="mt-8 font-display text-[30px] font-extrabold leading-[1.1] tracking-tight">
                Gwalior&apos;s fashion,<br />at your door in minutes.
              </h3>
              <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-white/70">
                One account for orders, live tracking and faster checkout.
              </p>

              <ul className="mt-7 space-y-4">
                {PERKS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.12] ring-1 ring-white/15"><Icon size={17} /></span>
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-[12.5px] leading-snug text-white/65">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-8">
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/banners/try-then-buy.jpg" alt="" className="block aspect-[1672/941] w-full object-cover" />
              </div>
              <div className="absolute -bottom-3 left-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ivory shadow-pop">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                Delivering across {BRAND.city} now
              </div>
            </div>
          </aside>

          {/* ════════ RIGHT — form ════════ */}
          <section className="relative flex min-h-[540px] flex-col px-6 pb-7 pt-5 sm:px-10 sm:pb-9 sm:pt-8">
            {/* mobile grab handle */}
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ivory/10 sm:hidden" aria-hidden />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-display text-xl font-extrabold tracking-tight text-ivory md:invisible">
                OneT <span className="text-rose">India</span>
              </div>
              <button onClick={closeAuth} aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ivory/70 transition hover:bg-lilacbg hover:text-ivory">
                <X size={18} />
              </button>
            </div>

            {/* progress */}
            {step !== 'done' && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex flex-1 gap-1.5">
                  {STEPS.map((s, i) => (
                    <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-lilacbg">
                      <motion.span className="block h-full rounded-full bg-rose"
                        initial={false} animate={{ width: i <= stepIndex ? '100%' : '0%' }} transition={{ duration: 0.35 }} />
                    </span>
                  ))}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Step {stepIndex + 1} of 3</span>
              </div>
            )}

            <div className="flex flex-1 flex-col justify-center py-6">
              <AnimatePresence mode="wait" initial={false}>
                {/* ── STEP 1: phone ── */}
                {step === 'phone' && (
                  <motion.div key="phone" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    <h2 id="auth-title" className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-ivory">Log in or sign up</h2>
                    <p className="mt-2 text-[14.5px] text-muted">Enter your mobile number. We&apos;ll send you a one-time code — no password needed.</p>

                    <label htmlFor="auth-phone" className="mt-7 block text-[13px] font-semibold text-ivory">Mobile number</label>
                    <motion.div key={`p${errKey}`} animate={err ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}
                      className={cx(
                        'mt-2 flex h-14 items-center rounded-2xl border-[1.5px] bg-white transition-shadow',
                        err ? 'border-red-400 ring-4 ring-red-500/10' : 'border-line focus-within:border-rose focus-within:ring-4 focus-within:ring-rose/10',
                      )}>
                      <span className="flex h-full items-center gap-2 border-r border-line pl-4 pr-3 text-[15px] font-semibold text-ivory">
                        <IndiaFlag /> +91
                      </span>
                      <input
                        id="auth-phone" value={fmtPhone(phone)} autoFocus
                        onChange={(e) => { setPhone(cleanPhone(e.target.value)); if (err) setErr(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={11}
                        className="h-full min-w-0 flex-1 bg-transparent px-4 text-[17px] font-medium tracking-wide text-ivory outline-none placeholder:font-normal placeholder:text-muted/60 focus-visible:outline-none"
                      />
                      <AnimatePresence>
                        {phoneOk && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="mr-4 grid h-6 w-6 place-items-center rounded-full bg-mint text-white">
                            <Check size={14} strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <FieldError msg={err} />

                    <PrimaryButton onClick={send} disabled={!phoneOk} busy={busy} busyLabel="Sending code…" className="mt-6">
                      Get OTP
                    </PrimaryButton>
                  </motion.div>
                )}

                {/* ── STEP 2: OTP ── */}
                {step === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    <h2 id="auth-title" className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-ivory">Enter verification code</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px] text-muted">
                      Sent to <span className="font-semibold text-ivory">+91 {fmtPhone(phone)}</span>
                      <button onClick={() => { setStep('phone'); setErr(''); setOtp(''); }}
                        className="inline-flex items-center gap-1 rounded-full bg-lilacbg px-2.5 py-0.5 text-[12px] font-semibold text-rose hover:bg-rose hover:text-white transition-colors">
                        <Pencil size={11} /> Edit
                      </button>
                    </p>

                    {demoCode && (
                      <div className="mt-4 rounded-xl border border-gold/40 bg-lemon px-3.5 py-2.5 text-[13px] text-ivory">
                        Test mode — your code is <b className="tracking-[0.2em]">{demoCode}</b>
                      </div>
                    )}

                    {/* one real input drives six boxes, so paste + SMS autofill just work */}
                    <motion.div key={`o${errKey}`} animate={err ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}
                      className="relative mt-7" onClick={() => otpRef.current?.focus()}>
                      <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => {
                          const filled = i < otp.length;
                          const active = i === otp.length && !busy;
                          return (
                            <div key={i}
                              className={cx(
                                'relative grid h-14 place-items-center rounded-2xl border-[1.5px] bg-white font-display text-2xl font-bold text-ivory transition-all sm:h-[60px]',
                                err ? 'border-red-400 bg-red-50/60' : active ? 'border-rose ring-4 ring-rose/10' : filled ? 'border-rose/50 bg-lilacbg/40' : 'border-line',
                              )}>
                              {otp[i] || ''}
                              {active && <span className="absolute h-6 w-[2px] animate-pulse rounded-full bg-rose" />}
                            </div>
                          );
                        })}
                      </div>
                      <input
                        ref={otpRef} value={otp} autoFocus
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (err) setErr(''); }}
                        inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="6-digit code"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none"
                      />
                    </motion.div>
                    <FieldError msg={err} />

                    <PrimaryButton onClick={() => verify(otp)} disabled={otp.length !== 6} busy={busy} busyLabel="Verifying…" className="mt-6">
                      Verify &amp; continue
                    </PrimaryButton>

                    <p className="mt-5 text-center text-[13.5px] text-muted">
                      Didn&apos;t get it?{' '}
                      {seconds > 0 ? (
                        <span>Resend in <span className="font-semibold tabular-nums text-ivory">0:{String(seconds).padStart(2, '0')}</span></span>
                      ) : (
                        <button onClick={resend} className="font-semibold text-rose hover:underline">Resend code</button>
                      )}
                    </p>
                  </motion.div>
                )}

                {/* ── STEP 3: name ── */}
                {step === 'name' && (
                  <motion.div key="name" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-mintbg px-3 py-1 text-[12px] font-semibold text-mint">
                      <Check size={13} strokeWidth={3} /> Number verified
                    </span>
                    <h2 id="auth-title" className="mt-4 font-display text-[28px] font-extrabold leading-tight tracking-tight text-ivory">What should we call you?</h2>
                    <p className="mt-2 text-[14.5px] text-muted">Your name helps our rider find you at the door.</p>

                    <label htmlFor="auth-name" className="mt-7 block text-[13px] font-semibold text-ivory">Full name</label>
                    <motion.div key={`n${errKey}`} animate={err ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.35 }}>
                      <input
                        id="auth-name" value={name} autoFocus
                        onChange={(e) => { setName(e.target.value.slice(0, 60)); if (err) setErr(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && saveName()}
                        autoComplete="name" autoCapitalize="words" placeholder="e.g. Aman Shivhare"
                        className={cx(
                          'mt-2 h-14 w-full rounded-2xl border-[1.5px] bg-white px-4 text-[16px] font-medium text-ivory outline-none transition-shadow placeholder:font-normal placeholder:text-muted/60 focus-visible:outline-none',
                          err ? 'border-red-400 ring-4 ring-red-500/10' : 'border-line focus:border-rose focus:ring-4 focus:ring-rose/10',
                        )}
                      />
                    </motion.div>
                    <FieldError msg={err} />

                    <PrimaryButton onClick={saveName} disabled={name.trim().length < 2} busy={busy} busyLabel="Saving…" className="mt-6">
                      Continue
                    </PrimaryButton>
                  </motion.div>
                )}

                {/* ── done ── */}
                {step === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 260, delay: 0.05 }}
                      className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                      <Check size={30} strokeWidth={3} />
                    </motion.span>
                    <h2 id="auth-title" className="mt-5 font-display text-[26px] font-extrabold tracking-tight text-ivory">
                      {first ? `Welcome, ${first}!` : "You're in!"}
                    </h2>
                    <p className="mt-1.5 text-[14.5px] text-muted">Taking you back to shopping…</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* footer */}
            <div className="border-t border-line pt-5">
              <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ivory/70">
                <Lock size={13} className="text-mint" /> Secure OTP login · we never share your number
              </p>
              <p className="mt-2 text-center text-[11.5px] leading-relaxed text-muted">
                By continuing you agree to our{' '}
                <Link href="/terms" onClick={closeAuth} className="font-medium text-ivory/80 underline decoration-line underline-offset-2 hover:text-rose">Terms</Link> and{' '}
                <Link href="/privacy-policy" onClick={closeAuth} className="font-medium text-ivory/80 underline decoration-line underline-offset-2 hover:text-rose">Privacy Policy</Link>
              </p>
              <p className="mt-3 flex items-center justify-center gap-1 text-[11.5px] text-muted md:hidden">
                <MapPin size={12} className="text-rose" /> Delivering across {BRAND.city} · {BRAND.workingHours}
              </p>
            </div>
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FieldError({ msg }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          role="alert" className="flex items-center gap-1.5 overflow-hidden pt-2 text-[13px] font-medium text-red-600">
          <AlertCircle size={14} className="shrink-0" /> {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function PrimaryButton({ children, onClick, disabled, busy, busyLabel, className }) {
  return (
    <button
      onClick={onClick} disabled={disabled || busy}
      className={cx(
        'group inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold transition-all',
        disabled && !busy
          ? 'cursor-not-allowed bg-lilacbg text-rose/45'
          : 'bg-rose text-white shadow-[0_14px_30px_-12px_rgba(109,34,217,0.7)] hover:bg-plum active:scale-[0.99]',
        busy && 'cursor-wait opacity-90',
        className,
      )}
    >
      {busy ? (
        <><Loader2 size={18} className="animate-spin" /> {busyLabel}</>
      ) : (
        <>{children} <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" /></>
      )}
    </button>
  );
}
