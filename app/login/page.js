'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthModal } from '@/lib/auth-modal';

function Redirector() {
  const router = useRouter();
  const params = useSearchParams();
  const openAuth = useAuthModal((s) => s.openAuth);
  useEffect(() => {
    const next = params.get('next') || '/';
    openAuth(next);
    router.replace('/');
  }, [openAuth, params, router]);
  return <div className="mx-auto max-w-md px-4 py-24 text-center text-muted">Opening login…</div>;
}

export default function LoginPage() {
  return <Suspense fallback={null}><Redirector /></Suspense>;
}
