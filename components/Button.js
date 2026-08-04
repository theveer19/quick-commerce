'use client';
import Link from 'next/link';
import { cx } from '@/lib/format';

const styles = {
  primary: 'bg-rose text-white hover:brightness-110 shadow-glow',
  ghost: 'bg-white text-ivory border border-line hover:border-rose hover:text-rose shadow-soft',
  violet: 'bg-plum text-white hover:brightness-110 shadow-soft',
  outline: 'border border-line bg-white/60 text-ivory hover:border-rose hover:text-rose',
};

export default function Button({ as = 'button', href, variant = 'primary', className = '', children, ...rest }) {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    styles[variant], className
  );
  if (as === 'link') return <Link href={href} className={cls} {...rest}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}
