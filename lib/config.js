export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

// True only when real keys are present. Until then the app runs on seed data
// so you can see/test the full UI without any setup.
export const SUPABASE_READY = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const RAZORPAY_READY = Boolean(RAZORPAY_KEY_ID);

/** Same-day delivery window, 10 AM – 7 PM IST, whatever the visitor's timezone. */
export function isOpenNow(date = new Date()) {
  const ist = new Date(date.getTime() + (date.getTimezoneOffset() + 330) * 60000);
  const h = ist.getHours();
  return h >= 10 && h < 19;
}

// Where we deliver. Gwalior city pincodes all start with 474. Add more
// prefixes (or full pincodes) here if the delivery area grows.
export const SERVICE_PINCODES = ['474'];
export function isServiceablePin(pin) {
  const p = String(pin || '').trim();
  return /^\d{6}$/.test(p) && SERVICE_PINCODES.some((x) => p.startsWith(x));
}
export const NOT_SERVICEABLE_MSG = 'Sorry, we deliver only within Gwalior city right now (pincodes starting with 474).';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.onet.co.in').replace(/\/$/, '');

// Android app on Google Play (iPhone app not out yet).
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.onetindia.app';

export const BRAND = {
  name: 'OneT India',
  tagline: 'Fashion delivered in minutes — Gwalior only',
  city: 'Gwalior',
  phone: '+91 78698 16989',
  // Same number with the spaces stripped. tel: links must not contain spaces —
  // they are not valid visual separators and some dialers drop the call.
  phoneTel: '+917869816989',
  email: 'Support@onet.co.in',
  // WhatsApp chat (number with country code, digits only) and Instagram handle
  // (without @). Leave instagram empty to hide the button.
  whatsapp: '917869816989',
  instagram: 'onetindia',
  linkedin: 'https://www.linkedin.com/in/aman-shivhare-709373226',
  address: 'City Centre, Tulsi Vihar Gwalior, Madhya Pradesh - 474001',
  gstin: '23NVUPS4364B1Z0',
  freeDeliveryAbove: 999,
  deliveryFee: 39,
  etaMinutes: 30,
  // Working hours & delivery
  workingHours: '10:00 AM – 7:00 PM',
  hoursNote: 'Orders placed after 7:00 PM are delivered the next day from 10:00 AM.',
  // Delivery promise — we say "in minutes", never a hard number.
  deliveryPromise: 'Delivered in minutes',
  delayNote: 'Delivery can take longer during bad weather, heavy traffic or peak demand.',
  // Policies
  refundPolicy: 'Same-day refund and exchange available. Report any issue at the time of delivery (Try & Buy).',
  exchangePolicy: 'Same-day exchange available — try at your door and swap on the spot if it doesn’t fit.',
};