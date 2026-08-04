'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/account'); }, [router]);
  return <div className="mx-auto max-w-md px-4 py-24 text-center text-muted">Opening your account…</div>;
}