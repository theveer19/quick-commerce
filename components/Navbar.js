'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, Zap, Package, User, LogOut, LogIn, MapPin, ChevronDown, Navigation, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { CATEGORIES } from '@/lib/seed';
import { BRAND } from '@/lib/config';
import { cx } from '@/lib/format';
import { getCurrentUser, signOutUser } from '@/lib/user-auth';
import { useAuthModal } from '@/lib/auth-modal';

const AREAS = ['City Centre', 'Lashkar', 'Morar', 'Thatipur', 'DD Nagar', 'Gola Ka Mandir', 'Vinay Nagar', 'Hazira', 'Bahodapur', 'Govindpuri', 'Sithouli', 'Maharajpura'];

/* module-level → not recreated each render (keeps input focus) */
function SearchBar({ value, onChange, onSubmit, className = '' }) {
  return (
    <form onSubmit={onSubmit} className={cx('relative', className)}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input value={value} onChange={onChange} placeholder="Search for dresses, shirts, kurtas…"
        className="w-full bg-white border border-line rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:border-violet outline-none shadow-soft" />
    </form>
  );
}

/* self-contained location picker: anchored dropdown, search on top, closes on outside-click / Escape */
function LocationPicker({ loc, onPick, full = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const filtered = AREAS.filter((a) => a.toLowerCase().includes(search.toLowerCase()));
  const pick = (a) => { onPick(a); setOpen(false); setSearch(''); };

  const detect = () => {
    setDetectErr('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setDetectErr('Location not supported on this device.'); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      () => { setDetecting(false); pick('Current location'); },
      () => { setDetecting(false); setDetectErr('Allow location access, or pick an area below.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={cx('relative', full && 'w-full')} ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-left rounded-lg px-2 py-1 hover:bg-lilacbg w-full">
        <MapPin size={16} className="text-rose shrink-0" />
        <span className="leading-tight min-w-0">
          <span className="block text-[10px] uppercase tracking-wide text-muted">Deliver to</span>
          <span className="block text-sm font-semibold text-ivory truncate">{loc}, Gwalior</span>
        </span>
        <ChevronDown size={14} className={cx('text-muted transition-transform ml-auto', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={cx('absolute z-[70] mt-2 rounded-2xl border border-line bg-white shadow-card p-3', full ? 'left-0 right-0' : 'left-0 w-[340px]')}>
            {/* search — on top, always visible */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search area, locality…"
                className="w-full bg-ink border border-line rounded-xl pl-10 pr-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
            </div>

            <button onClick={detect} disabled={detecting}
              className="mt-2 w-full flex items-center gap-2.5 rounded-xl border border-rose/30 bg-rose/5 px-3 py-2.5 text-left hover:bg-rose/10 transition disabled:opacity-60">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-rose text-white shrink-0">
                {detecting ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={14} />}
              </span>
              <span className="text-sm font-semibold text-rose">{detecting ? 'Detecting…' : 'Use my current location'}</span>
            </button>
            {detectErr && <p className="mt-2 text-xs text-rose">{detectErr}</p>}

            <p className="mt-3 mb-1 px-1 text-[11px] uppercase tracking-wide text-muted">Popular areas in {BRAND.city}</p>
            <div className="max-h-56 overflow-y-auto no-scrollbar">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No area found.</p>
              ) : filtered.map((a) => (
                <button key={a} onClick={() => pick(a)}
                  className={cx('w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-lilacbg text-left', a === loc && 'bg-lilacbg')}>
                  <MapPin size={16} className={a === loc ? 'text-rose' : 'text-muted'} />
                  <span>
                    <span className={cx('block text-sm font-medium', a === loc ? 'text-rose' : 'text-ivory')}>{a}</span>
                    <span className="block text-xs text-muted">{BRAND.city}, Madhya Pradesh</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCart((s) => s.count());
  const openAuth = useAuthModal((s) => s.openAuth);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loc, setLoc] = useState('Gwalior');

  useEffect(() => {
    setMounted(true);
    try { const l = localStorage.getItem('onet_location'); if (l) setLoc(l); } catch {}
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    let alive = true;
    const load = async () => { const u = await getCurrentUser(); if (alive) setUser(u); };
    load();
    const onAuth = () => load();
    window.addEventListener('onet-auth', onAuth);
    return () => { alive = false; window.removeEventListener('onet-auth', onAuth); };
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  const submitSearch = (e) => { e.preventDefault(); router.push(`/products?search=${encodeURIComponent(q.trim())}`); };
  const logout = async () => { await signOutUser(); router.push('/'); };
  const pickLoc = (a) => { setLoc(a); try { localStorage.setItem('onet_location', a); } catch {} };

  return (
    <header className={cx('sticky top-0 z-50 transition-all', scrolled ? 'glass' : 'bg-ink/80 backdrop-blur')}>
      <div className="bg-rose text-white text-[13px] font-semibold tracking-tight">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-center gap-2">
          <Zap size={14} className="fill-white" />
          <span>Try &amp; Buy · Delivered in ~{BRAND.etaMinutes} mins · {BRAND.city} only</span>
        </div>
      </div>

      <nav className="mx-auto max-w-7xl px-4">
        <div className="h-16 flex items-center gap-3">
          <button className="md:hidden text-ivory" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>

          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <span className="font-display text-2xl font-extrabold tracking-tight text-ivory">OneT</span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-rose">India</span>
          </Link>

          <div className="hidden md:block shrink-0">
            <LocationPicker loc={loc} onPick={pickLoc} />
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-1">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/products?category=${c.slug}`}
                className="px-3 py-2 text-sm text-muted hover:text-ivory transition-colors rounded-lg hover:bg-lilacbg">
                {c.name}
              </Link>
            ))}
          </div>

          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} onSubmit={submitSearch} className="hidden md:block flex-1 max-w-md ml-auto" />

          <div className="flex items-center gap-1 ml-auto md:ml-2">
            <Link href="/track" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-ivory rounded-lg hover:bg-lilacbg">
              <Package size={18} /> <span className="hidden xl:inline">Track</span>
            </Link>

            {mounted && user ? (
              <>
                <Link href="/account" className="flex items-center gap-1.5 px-3 py-2 text-sm text-ivory rounded-lg hover:bg-lilacbg">
                  <User size={18} /> <span className="hidden sm:inline max-w-[90px] truncate">{user.name ? user.name.split(' ')[0] : 'Account'}</span>
                </Link>
                <button onClick={logout} className="hidden sm:grid place-items-center p-2.5 text-muted hover:text-rose rounded-lg hover:bg-lilacbg" aria-label="Logout">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button onClick={() => openAuth()} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-plum rounded-lg hover:bg-lilacbg">
                <LogIn size={18} /> <span className="hidden sm:inline">Login</span>
              </button>
            )}

            <Link href="/cart" className="relative p-2.5 text-ivory hover:bg-lilacbg rounded-lg" aria-label="Cart">
              <ShoppingBag size={20} />
              {mounted && count > 0 && (
                <motion.span key={count} initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-rose text-white text-[11px] font-bold min-w-[18px] h-[18px] rounded-full grid place-items-center px-1">
                  {count}
                </motion.span>
              )}
            </Link>
          </div>
        </div>

        <div className="md:hidden pb-3 space-y-2">
          <LocationPicker loc={loc} onPick={pickLoc} full />
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} onSubmit={submitSearch} />
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden glass border-t border-line">
            <div className="p-4 space-y-1">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/products?category=${c.slug}`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-lilacbg">
                  <span className="text-xl">{c.emoji}</span> <span className="font-medium">{c.name}</span>
                </Link>
              ))}
              <Link href="/track" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-lilacbg">
                <Package size={20} /> <span className="font-medium">Track order</span>
              </Link>
              {mounted && user ? (
                <>
                  <Link href="/account" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-lilacbg">
                    <User size={20} /> <span className="font-medium">My account</span>
                  </Link>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-lilacbg text-rose">
                    <LogOut size={20} /> <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <button onClick={() => { setOpen(false); openAuth(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-lilacbg text-plum">
                  <LogIn size={20} /> <span className="font-medium">Login / Sign up</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}