// Big "Get the OneT app" section at the top of the footer.
// Left: pitch, perks, Play button (+ QR to scan from a laptop).
// Right: a phone drawn in CSS showing the app with a live order notification.
import { Bell, MapPin, Zap, Gift, Star } from 'lucide-react';
import PlayBadge from './PlayBadge';
import { PLAY_STORE_URL } from '@/lib/config';

const PERKS = [
  { icon: MapPin, title: 'Live order tracking', text: 'See your rider on the way, step by step.' },
  { icon: Bell, title: 'Instant updates', text: 'Confirmed, packed, on the way — right on your phone.' },
  { icon: Gift, title: 'First to know', text: 'New stock, winter drops and sales before anyone else.' },
  { icon: Zap, title: 'One-tap checkout', text: 'Your address and bag saved — order in seconds.' },
];

export default function AppDownloadBand() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14">
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#2A0870_0%,#4C14B8_45%,#7B33FB_100%)] text-white shadow-pop">
        {/* soft glows */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fashionpink/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-violet/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 md:grid-cols-[1.25fr_1fr] md:py-14 lg:px-14">
          {/* ── copy ── */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ring-1 ring-white/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              Now on Google Play
            </span>

            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[44px]">
              Fashion in minutes,<br className="hidden sm:block" /> now in your pocket.
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/80">
              Get the OneT India app for the fastest way to shop Gwalior&apos;s latest styles — try at your door, keep what you love.
            </p>

            <ul className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/15">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-[13px] leading-snug text-white/70">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <PlayBadge className="!px-5 !py-3 ring-1 ring-white/25 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-transform" />

              {/* QR — handy on a laptop: scan with the phone camera */}
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
                 className="hidden md:flex items-center gap-3 rounded-2xl bg-white/10 p-2 pr-4 ring-1 ring-white/15 hover:bg-white/15 transition-colors">
                <span className="block rounded-xl bg-white p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/app-qr.svg" alt="QR code to download the OneT India app" width={64} height={64} className="block h-16 w-16" />
                </span>
                <span className="text-[13px] leading-snug text-white/80">
                  <b className="block text-white">Scan to download</b>
                  Point your phone camera here
                </span>
              </a>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-white/60">
              <Star size={12} className="fill-gold text-gold" /> Free to download · Android · iPhone app coming soon
            </p>
          </div>

          {/* ── phone ── */}
          <div className="relative mx-auto hidden w-full max-w-[300px] sm:block">
            <div className="animate-float">
              <div className="relative mx-auto w-[250px] rounded-[42px] bg-[#0E0B1A] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
                <div className="absolute left-1/2 top-[18px] z-10 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-black" />
                <div className="relative h-[480px] overflow-hidden rounded-[33px] bg-[#FBFAFF]">
                  {/* app header */}
                  <div className="bg-[linear-gradient(160deg,#3B0A8F,#7B33FB)] px-4 pb-4 pt-10 text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-base font-extrabold">OneT <span className="text-[#C4B5FD]">INDIA</span></span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold">● IN MINUTES</span>
                    </div>
                    <div className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-[10px] text-white/80">Search tees, kurtis, sneakers…</div>
                  </div>
                  {/* banner */}
                  <div className="px-3 pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/banners/try-then-buy.jpg" alt="" className="block aspect-[1672/941] w-full rounded-xl object-cover" />
                  </div>
                  {/* category chips */}
                  <div className="flex gap-1.5 px-3 pt-3">
                    {['Women', 'Men', 'Unisex', 'Ethnic'].map((c, i) => (
                      <span key={c} className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${i === 0 ? 'bg-[#7B33FB] text-white' : 'bg-[#EDE5FF] text-[#3B0A8F]'}`}>{c}</span>
                    ))}
                  </div>
                  {/* product tiles */}
                  <div className="grid grid-cols-2 gap-2 px-3 pt-3">
                    {[['#FCE7F3', '₹799'], ['#E1EEFF', '₹1,299'], ['#FFEBDD', '₹649'], ['#DDF7EC', '₹999']].map(([bg, p]) => (
                      <div key={p} className="rounded-xl bg-white p-1.5 shadow-soft">
                        <div className="h-16 rounded-lg" style={{ background: bg }} />
                        <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-[#17142B]/10" />
                        <div className="mt-1 text-[9px] font-bold text-[#17142B]">{p}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* floating notification */}
            <div className="absolute -left-10 top-36 w-[230px] rounded-2xl bg-white/95 p-3 text-[#17142B] shadow-pop ring-1 ring-black/5 backdrop-blur md:-left-4 lg:-left-20">
              <div className="flex items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#7B33FB] text-[10px] font-black text-white">OneT</span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">🛵 On the way! <span className="font-medium text-muted">now</span></div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted">Your order is out for delivery and arriving in minutes.</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 bottom-20 rounded-2xl bg-white/95 px-3 py-2 text-[11px] font-bold text-[#17142B] shadow-pop ring-1 ring-black/5 lg:-right-8">
              ❄️ Winter drop is live
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
