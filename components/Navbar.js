'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, Package, User, LogOut, LogIn, MapPin, ChevronDown, Navigation, Loader2, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { BRAND } from '@/lib/config';
import { cx } from '@/lib/format';
import { getCurrentUser, signOutUser } from '@/lib/user-auth';
import { useAuthModal } from '@/lib/auth-modal';

const AREAS = ['City Centre', 'Lashkar', 'Morar', 'Thatipur', 'DD Nagar', 'Gola Ka Mandir', 'Vinay Nagar', 'Hazira', 'Bahodapur', 'Govindpuri', 'Sithouli', 'Maharajpura', 'Madhavganj', 'Phalka Bazar', 'Sarafa Bazar', 'Jhansi Road', 'Dabra Road', 'University Road', 'Kampoo', 'Naka Chandravadani', 'Tansen Nagar', 'Deen Dayal Nagar', 'Kailash Nagar', 'Chetakpuri', 'Gandhi Nagar', 'Aditya Nagar', 'Birla Nagar', 'Shinde Ki Chhawni', 'Padav', 'Roxy Talkies', 'Darpan Colony', 'Bhagwati Nagar'];

const NAV = [
  { label: 'Women', href: '/products?category=women' },
  { label: 'Men', href: '/products?category=men' },
  { label: 'Offers', href: '/offers' },
];

function Logo() {
  return (
    <Link href="/" className="flex flex-col leading-none shrink-0">
      <span className="font-display text-2xl font-extrabold tracking-tight text-ivory">One<span className="text-rose">T</span> <span className="text-rose">India</span></span>
      <span className="text-[9px] font-semibold text-muted -mt-0.5">First Try. Then Buy. <span className="text-fashionpink">♥</span></span>
    </Link>
  );
}

function SearchBar({ value, onChange, onSubmit, className = '' }) {
  return (
    <form onSubmit={onSubmit} className={cx('relative', className)}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input value={value} onChange={onChange} placeholder="Search for clothes, shoes, bags & more…"
        className="w-full bg-cloud border border-line rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:border-violet outline-none" />
    </form>
  );
}

function LocationPicker({ loc, onPick, dark }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const openMenu = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) {
      const width = 340;
      const left = Math.max(8, Math.min(r.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - width - 8));
      setCoords({ top: r.bottom + 8, left });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  const filtered = AREAS.filter((a) => a.toLowerCase().includes(search.toLowerCase()));
  const pick = (a) => { onPick(a); setOpen(false); setSearch(''); };

  const detect = () => {
    setDetectErr('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setDetectErr('Location not supported.'); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const key = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
          if (key) {
            const r = await fetch(`https://us1.locationiq.com/v1/reverse?key=${key}&lat=${latitude}&lon=${longitude}&format=json&normalizeaddress=1`);
            const j = await r.json();
            const a = j.address || {};
            const area = a.suburb || a.neighbourhood || a.residential || a.quarter || a.hamlet || a.city_district || a.town || a.village || a.city || 'Current location';
            console.log('LocationIQ address:', a);
            setDetecting(false); pick(area);
          } else {
            const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const j = await r.json();
            setDetecting(false); pick(j.locality || j.city || j.principalSubdivision || 'Current location');
          }
        } catch { setDetecting(false); pick('Current location'); }
      },
      () => { setDetecting(false); setDetectErr('Allow location, or pick an area.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <>
      <button ref={triggerRef} onClick={() => (open ? setOpen(false) : openMenu())}
        className={cx('flex items-center gap-1 text-sm font-semibold rounded-lg px-2 py-1 shrink-0', dark ? 'text-white hover:bg-white/10' : 'text-ivory hover:bg-lilacbg')}>
        <MapPin size={14} className={dark ? 'text-white' : 'text-rose'} />
        <span className="max-w-[140px] truncate">{loc}</span>
        <ChevronDown size={13} className={cx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div ref={popRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: 340, zIndex: 200 }}
          className="rounded-2xl border border-line bg-white shadow-pop p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search area, locality…"
              className="w-full bg-cloud border border-line rounded-xl pl-10 pr-3 py-2.5 text-sm text-ivory outline-none focus:border-violet" />
          </div>
          <button onClick={detect} disabled={detecting} className="mt-2 w-full flex items-center gap-2.5 rounded-xl border border-rose/30 bg-rose/5 px-3 py-2.5 text-left hover:bg-rose/10 transition disabled:opacity-60">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-rose text-white shrink-0">{detecting ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={14} />}</span>
            <span className="text-sm font-semibold text-rose">{detecting ? 'Detecting…' : 'Use my current location'}</span>
          </button>
          {detectErr && <p className="mt-2 text-xs text-rose">{detectErr}</p>}
          <p className="mt-3 mb-1 px-1 text-[11px] uppercase tracking-wide text-muted">Popular areas in {BRAND.city}</p>
          <div className="max-h-56 overflow-y-auto no-scrollbar">
            {filtered.length === 0 ? <p className="text-sm text-muted py-4 text-center">No area found.</p> : filtered.map((a) => (
              <button key={a} onClick={() => pick(a)} className={cx('w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-lilacbg text-left', a === loc && 'bg-lilacbg')}>
                <MapPin size={16} className={a === loc ? 'text-rose' : 'text-muted'} />
                <span><span className={cx('block text-sm font-medium', a === loc ? 'text-rose' : 'text-ivory')}>{a}</span><span className="block text-xs text-muted">{BRAND.city}, MP</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCart((s) => s.count());
  const openAuth = useAuthModal((s) => s.openAuth);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loc, setLoc] = useState('Gwalior');

  useEffect(() => { setMounted(true); try { const l = localStorage.getItem('onet_location'); if (l) setLoc(l); } catch {} }, []);
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
    <header className="sticky top-0 z-[100]">
      {/* top row */}
      <div className="bg-white border-b border-line">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3">
          <button className="md:hidden text-ivory" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <Logo />
          <SearchBar value={q} onChange={(e) => setQ(e.target.value)} onSubmit={submitSearch} className="hidden md:block flex-1 max-w-xl mx-auto" />
          <div className="flex items-center gap-1 ml-auto">
            <Link href="/wishlist" className="grid place-items-center w-10 h-10 rounded-lg text-muted hover:text-fashionpink hover:bg-lilacbg" aria-label="Wishlist"><Heart size={20} /></Link>
            {mounted && user ? (
              <>
                <Link href="/account" className="flex items-center gap-1.5 px-2 py-2 text-sm text-ivory rounded-lg hover:bg-lilacbg"><User size={18} /><span className="hidden sm:inline max-w-[80px] truncate">{user.name ? user.name.split(' ')[0] : 'Account'}</span></Link>
                <button onClick={logout} className="hidden sm:grid place-items-center p-2.5 text-muted hover:text-rose rounded-lg hover:bg-lilacbg" aria-label="Logout"><LogOut size={18} /></button>
              </>
            ) : (
              <button onClick={() => openAuth()} className="flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-ivory rounded-lg hover:bg-lilacbg"><User size={18} /><span className="hidden sm:inline">Login</span></button>
            )}
            <Link href="/cart" className="relative grid place-items-center w-10 h-10 rounded-lg text-ivory hover:bg-lilacbg" aria-label="Cart">
              <ShoppingBag size={20} />
              {mounted && count > 0 && <span className="absolute top-1 right-1 bg-rose text-white text-[10px] font-bold min-w-[16px] h-[16px] rounded-full grid place-items-center px-1">{count}</span>}
            </Link>
          </div>
        </div>
        {/* mobile search */}
        <div className="md:hidden px-4 pb-3"><SearchBar value={q} onChange={(e) => setQ(e.target.value)} onSubmit={submitSearch} /></div>
      </div>

      {/* dark category strip */}
      <div className="bg-plum text-white">
        <div className="mx-auto max-w-7xl px-4 h-11 flex items-center gap-3">
          <LocationPicker loc={loc} onPick={pickLoc} dark />
          <span className="h-4 w-px bg-white/20 shrink-0" />
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} className="shrink-0 px-4 py-1.5 text-sm font-semibold tracking-wide text-white/90 hover:text-white hover:bg-white/10 rounded-lg whitespace-nowrap">{n.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-white border-t border-line">
            <div className="p-4 space-y-1">
              {NAV.map((n) => <Link key={n.label} href={n.href} className="block px-3 py-2.5 rounded-xl hover:bg-lilacbg font-medium text-ivory">{n.label}</Link>)}
              <div className="h-px bg-line my-1" />
              <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilacbg text-ivory"><Heart size={20} /> Wishlist</Link>
              <Link href="/track" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilacbg text-ivory"><Package size={20} /> Track order</Link>
              {mounted && user ? (
                <>
                  <Link href="/account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilacbg text-ivory"><User size={20} /> My account</Link>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilacbg text-rose"><LogOut size={20} /> Logout</button>
                </>
              ) : (
                <button onClick={() => { setOpen(false); openAuth(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-lilacbg text-ivory"><LogIn size={20} /> Login / Sign up</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}