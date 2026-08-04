'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { signIn, getUser } from '@/lib/auth';
import { SUPABASE_READY } from '@/lib/config';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { getUser().then((u) => { if (u) router.replace('/admin'); }); }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await signIn(email, password); router.replace('/admin'); }
    catch (e) { setErr(e.message || 'Login failed'); setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-ink">
      <div className="w-full max-w-sm rounded-xl2 border border-line bg-surface p-8">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="font-display text-2xl font-extrabold text-ivory">OneT</span>
          <span className="font-display text-2xl font-extrabold text-rose">India</span>
        </div>
        <div className="mt-1 text-center text-sm text-muted">Admin panel</div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-muted">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet" />
          </div>
          <div>
            <label className="text-xs text-muted">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet" />
          </div>
          {err && <p className="text-sm text-rose bg-rose/10 rounded-lg px-3 py-2">{err}</p>}
          <button disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose text-white px-6 py-3 font-semibold shadow-glow disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />} Sign in
          </button>
        </form>

        {!SUPABASE_READY && (
          <p className="mt-4 text-center text-xs text-muted">Demo mode · password: <span className="text-ivory font-mono">onet-admin</span></p>
        )}
      </div>
    </div>
  );
}
