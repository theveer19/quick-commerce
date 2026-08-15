export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

// True only when real keys are present. Until then the app runs on seed data
// so you can see/test the full UI without any setup.
export const SUPABASE_READY = Boolean(SUPABASE_URL && SUPABASE_ANON);
export const RAZORPAY_READY = Boolean(RAZORPAY_KEY_ID);

export const BRAND = {
  name: 'OneT India',
  tagline: 'Fashion delivered in minutes — Gwalior only',
  city: 'Gwalior',
  phone: '+91 70004 18227',
  email: 'Support@onet.co.in',
  address: 'City Centre, Tulsi Vihar Gwalior, Madhya Pradesh - 474001',
  gstin: '23NVUPS4364B1Z0',
  freeDeliveryAbove: 999,
  deliveryFee: 39,
  etaMinutes: 30,
  // Working hours & delivery
  workingHours: '10:00 AM – 10:00 PM',
  hoursNote: 'Orders placed after 10:00 PM will be delivered the next day.',
  // Policies
  refundPolicy: 'Same-day refund and exchange available. Report any issue at the time of delivery (Try & Buy).',
  exchangePolicy: 'Same-day exchange available — try at your door and swap on the spot if it doesn’t fit.',
};