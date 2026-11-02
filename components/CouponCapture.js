'use client';
import { useEffect } from 'react';

// Influencer links like /?coupon=RIYA10 — remember the code so checkout can
// auto-apply it (and the order records which influencer it came from).
export const COUPON_KEY = 'onet_coupon';

export default function CouponCapture() {
  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get('coupon');
      const code = (c || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
      if (code) localStorage.setItem(COUPON_KEY, code);
    } catch {}
  }, []);
  return null;
}
