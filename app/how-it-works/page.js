'use client';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { BRAND } from '@/lib/config';
import { Sparkles, Truck, PackageCheck, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: Sparkles, t: 'Browse & add', d: 'Explore live fashion drops across women, men, footwear, ethnic and more. Add anything you want to try.' },
  { icon: Truck, t: `Delivered in ~${BRAND.etaMinutes} min`, d: `Our rider brings your picks to your door anywhere in ${BRAND.city}, fast.` },
  { icon: PackageCheck, t: 'Try at your door', d: 'Try everything on in the comfort of home. Keep what fits and looks great.' },
  { icon: ShieldCheck, t: 'Pay for keeps', d: 'Return the rest to the rider on the spot. Pay only for what you keep — UPI, card or cash.' },
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Reveal>
        <span className="text-rose font-semibold text-sm uppercase tracking-wide">Try &amp; Buy</span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold text-ivory">How it works</h1>
        <p className="mt-4 text-muted text-lg">No risk, no guesswork. Fashion the way it should be — try before you buy, delivered in minutes.</p>
      </Reveal>
      <div className="mt-12 space-y-4">
        {steps.map((s, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="flex gap-5 rounded-xl2 border border-line bg-surface p-6">
              <div className="shrink-0 grid place-items-center w-12 h-12 rounded-full bg-rose/15 text-rose"><s.icon size={22} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-muted">0{i + 1}</span>
                  <h2 className="font-display text-xl font-semibold text-ivory">{s.t}</h2>
                </div>
                <p className="mt-1 text-muted">{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/products" className="inline-flex rounded-full bg-rose text-white px-8 py-4 font-semibold shadow-glow">Start shopping</Link>
      </div>
    </div>
  );
}
