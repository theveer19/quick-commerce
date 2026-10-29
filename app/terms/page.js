import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Terms & Conditions' };
export default function Page() {
  return <LegalPage title="Terms & Conditions"
    intro={`By using ${BRAND.name}, you agree to these terms. Please read them carefully.`}
    sections={[
      { h: 'Eligibility', p: [`You must be able to receive deliveries within ${BRAND.city} and provide accurate contact and address details.`] },
      { h: 'Orders & Try & Buy', p: ['Placing an order is an offer to buy. For Try & Buy, you agree to pay for items you keep after trying. Items returned at the door are removed from your bill.'] },
      { h: 'Pricing', p: ['All prices are in INR and inclusive of applicable taxes. We may update prices and offers at any time. The price shown at checkout is the price you pay.'] },
      { h: 'Payments', p: ['Prepaid payments are handled by Razorpay. Try & Buy payments are collected at the door via UPI, card or cash for kept items.'] },
      { h: 'Cancellations & returns', p: ['Cancellations, returns and refunds are governed by our Return and Refund policies.'] },
      { h: 'Acceptable use', p: ['You agree not to misuse the service, place fraudulent orders, or repeatedly refuse deliveries without reason. We may refuse service to protect our riders and business.'] },
      { h: 'Delivery time & hours', p: [`We deliver in minutes within ${BRAND.city}, every day from ${BRAND.workingHours}. ${BRAND.hoursNote} Delivery times are estimates and may be longer due to weather, traffic, festivals or high demand.`] },
      { h: 'Stock availability', p: ['Products are subject to availability. Items that are out of stock cannot be ordered. If an item becomes unavailable after you order, we will inform you and refund any amount paid for it.'] },
      { h: 'Liability', p: [`${BRAND.name} is not liable for delays caused by factors beyond our control such as weather, traffic or events. Our liability for any order is limited to the order value.`] },
      { h: 'Governing law', p: ['These terms are governed by the laws of India. Any disputes are subject to the jurisdiction of the courts of Gwalior, Madhya Pradesh.'] },
    ]} />;
}
