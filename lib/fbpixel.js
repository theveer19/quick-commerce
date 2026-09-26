'use client';
// Meta (Facebook) Pixel helper — one place for the ID + safe event tracking.
export const FB_PIXEL_ID = '961183373693080';

export function fbTrack(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', event, params);
    }
  } catch {}
}
