import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Refund Policy' };
export default function Page() {
  return <LegalPage title="Refund Policy"
    intro={`At ${BRAND.name}, our Try & Buy model means you mostly pay only for what you keep. This policy explains how refunds work for prepaid orders and returns.`}
    sections={[
      { h: 'Try & Buy orders', p: ['With Try & Buy, you inspect and try items at your door and hand unwanted items back to the rider immediately. You are charged only for what you keep, so there is usually nothing to refund.'] },
      { h: 'Prepaid (Razorpay) orders', p: ['If you paid online and return one or more items at the door, the amount for the returned items is refunded to your original payment method.', 'Refunds are initiated within 24 hours of the return being confirmed by our rider.'] },
      { h: 'Refund timelines', p: [['UPI: 1–3 business days', 'Cards: 3–7 business days', 'Netbanking / wallets: 3–5 business days'], 'Timelines depend on your bank or payment provider once we initiate the refund from our side.'] },
      { h: 'Cancellations', p: ['You can cancel a prepaid order before it is marked "Out for delivery" for a full refund. Once out for delivery, use the Try & Buy return-at-door option instead.'] },
      { h: 'How to request a refund', p: [`Contact us at ${BRAND.email} or ${BRAND.phone} with your order code. We will confirm eligibility and initiate the refund.`] },
    ]} />;
}
