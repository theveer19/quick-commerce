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
  phone: '+91 00000 00000',
  email: 'support@onetindia.in',
  address: 'Gwalior, Madhya Pradesh, India',
  freeDeliveryAbove: 999,
  deliveryFee: 39,
  etaMinutes: 30,
};
