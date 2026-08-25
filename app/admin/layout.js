'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Boxes, Tag, LogOut, Loader2, Menu, X } from 'lucide-react';
import { getUser, signOut } from '@/lib/auth';
import { SUPABASE_READY } from '@/lib/config';
import { cx } from '@/lib/format';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  const [open, setOpen] = useState(false);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (isLogin) { setUser(null); return; }
    getUser().then((u) => {
      setUser(u);
      if (!u) router.replace('/admin/login');
    });
  }, [pathname, isLogin, router]);

  if (isLogin) return children;

  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center bg-ink text-muted"><Loader2 className="animate-spin" /></div>;
  }
  if (!user) return null;

  const logout = async () => { await signOut(); router.replace('/admin/login'); };

  const SideNav = () => (
    <nav className="space-y-1">
      {nav.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
            className={cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-rose text-white' : 'text-muted hover:text-ivory hover:bg-lilacbg')}>
            <n.icon size={18} /> {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink">
      {/* top bar */}
      <div className="sticky top-0 z-40 glass border-b border-line">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-ivory" onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
            <Link href="/admin" className="flex items-center gap-1.5">
              <span className="font-display text-lg font-extrabold text-ivory">OneT</span>
              <span className="font-display text-lg font-extrabold text-rose">Admin</span>
            </Link>
            {!SUPABASE_READY && <span className="text-[10px] uppercase font-bold bg-violet/20 text-violet px-2 py-0.5 rounded-full">Demo data</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted">{user.email}</span>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-muted hover:text-rose"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-line min-h-[calc(100vh-3.5rem)] p-4">
          <SideNav />
        </aside>
        {/* mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 zF-30 top-14">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="relative w-64 h-full bg-surface border-r border-line p-4"><SideNav /></aside>
          </div>
        )}
        <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}