import { BRAND } from '@/lib/config';

export default function LegalPage({ title, updated = 'August 2026', intro, sections }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-muted">Legal</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-ivory">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
      {intro && <p className="mt-6 text-muted leading-relaxed">{intro}</p>}
      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display text-xl font-semibold text-ivory">{s.h}</h2>
            <div className="mt-3 space-y-3 text-muted leading-relaxed">
              {s.p.map((para, j) =>
                Array.isArray(para) ? (
                  <ul key={j} className="list-disc pl-5 space-y-1.5">
                    {para.map((li, k) => <li key={k}>{li}</li>)}
                  </ul>
                ) : (
                  <p key={j}>{para}</p>
                )
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-12 rounded-xl2 border border-line bg-surface p-6">
        <p className="text-sm text-muted">Questions about this policy? Reach us at <span className="text-ivory">{BRAND.email}</span> or {BRAND.phone}.</p>
      </div>
    </div>
  );
}
