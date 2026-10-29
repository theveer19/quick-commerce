import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Shipping & Delivery' };
export default function Page() {
  return <LegalPage title="Shipping & Delivery Policy"
    intro={`${BRAND.name} delivers fashion across ${BRAND.city} in minutes. Here are the details.`}
    sections={[
      { h: 'Delivery area', p: [`We currently deliver only within ${BRAND.city}, Madhya Pradesh. If your pincode is outside our serviceable zone, checkout will let you know.`] },
      { h: 'Delivery time', p: [`Orders are delivered in minutes across ${BRAND.city}. Actual delivery time depends on your location, and can be longer during bad weather, heavy traffic, festivals or peak order volume. Any time shown in the app or on the website is an estimate, not a guarantee. You can track your order live on your order page.`] },
      { h: 'Delivery hours', p: [`We deliver every day from ${BRAND.workingHours}.`, `${BRAND.hoursNote}`] },
      { h: 'Delivery charges', p: [`Delivery is free on orders above ₹${BRAND.freeDeliveryAbove}. Below that, a flat delivery fee of ₹${BRAND.deliveryFee} applies, shown at checkout before you pay.`] },
      { h: 'Order tracking', p: ['Every order gets a unique code (for example ONET-20260802-AB12). Use the Track page or your confirmation link to follow your order through each stage.'] },
      { h: 'Missed delivery', p: ['If you are unavailable when the rider arrives, we will attempt to contact you on your registered mobile number. Undelivered Try & Buy orders are returned to our hub.'] },
    ]} />;
}
