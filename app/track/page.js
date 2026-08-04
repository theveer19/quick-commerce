'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search } from 'lucide-react';

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const go = (e) => { e.preventDefault(); if (code.trim()) router.push(`/order/${code.trim().toUpperCase()}`); };

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto w-16 h-16 grid place-items-center rounded-full bg-surface border border-line">
        <Package className="text-rose" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-ivory">Track your order</h1>
      <p className="mt-2 text-muted">Enter the order code from your confirmation (e.g. ONET-20260802-AB12).</p>
      <form onSubmit={go} className="mt-8 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ONET-XXXXXXXX-XXXX"
          className="flex-1 bg-surface border border-line rounded-full px-5 py-3.5 text-sm outline-none focus:border-violet uppercase" />
        <button className="grid place-items-center w-12 h-12 rounded-full bg-rose text-white shadow-glow" aria-label="Track"><Search size={20} /></button>
      </form>
    </div>
  );
}
