'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Phone, Mail, Package } from 'lucide-react';
import { BRAND } from '@/lib/config';

const faqs = [
  { q: 'How fast is delivery?', a: `Most orders reach you in about ${BRAND.etaMinutes} minutes anywhere in ${BRAND.city}, depending on your location and order volume.` },
  { q: 'What is Try & Buy?', a: 'You order items, our rider brings them to your door, you try them on, keep what you love and hand the rest back. You pay only for what you keep.' },
  { q: 'How do I pay?', a: 'Choose Try & Buy (pay at door via UPI/card/cash for kept items) or pay online securely via Razorpay at checkout.' },
  { q: 'Do you deliver outside Gwalior?', a: 'Not yet. We currently serve Gwalior only. We will expand soon — follow us for updates.' },
  { q: 'How do I return something after delivery?', a: `Contact us within 3 days with your order code. Items must be unused with tags. See our Return Policy for details.` },
  { q: 'How do refunds work?', a: 'For prepaid returns, we refund to your original payment method within 24 hours of confirming the return. See our Refund Policy for timelines.' },
  { q: 'Where is my order?', a: 'Use the Track page with your order code (like ONET-20260802-AB12) to see live status.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-line rounded-xl2 bg-surface overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
        <span className="font-medium text-ivory">{q}</span>
        <ChevronDown size={18} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <p className="px-5 pb-5 text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-ivory">Help &amp; Support</h1>
      <p className="mt-3 text-muted text-lg">We&apos;re here for you. Track an order, read FAQs, or reach our team.</p>

      <div id="contact" className="mt-8 grid gap-3 sm:grid-cols-2">
        <a href={`tel:${BRAND.phone}`} className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-5 hover:border-rose transition-colors">
          <Phone className="text-rose" /> <div><p className="text-sm text-muted">Call us</p><p className="text-ivory font-medium">{BRAND.phone}</p></div>
        </a>
        <a href="#" className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-5 hover:border-mint transition-colors">
          <MessageCircle className="text-mint" /> <div><p className="text-sm text-muted">WhatsApp</p><p className="text-ivory font-medium">Chat with support</p></div>
        </a>
        <a href={`mailto:${BRAND.email}`} className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-5 hover:border-violet transition-colors">
          <Mail className="text-violet" /> <div><p className="text-sm text-muted">Email</p><p className="text-ivory font-medium">{BRAND.email}</p></div>
        </a>
        <Link href="/track" className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-5 hover:border-rose transition-colors">
          <Package className="text-rose" /> <div><p className="text-sm text-muted">Track order</p><p className="text-ivory font-medium">Check live status</p></div>
        </Link>
      </div>

      <h2 id="faq" className="mt-14 font-display text-2xl font-bold text-ivory">Frequently asked questions</h2>
      <div className="mt-6 space-y-3">
        {faqs.map((f, i) => <FAQItem key={i} {...f} />)}
      </div>
    </div>
  );
}
