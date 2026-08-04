import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Return Policy' };
export default function Page() {
  return <LegalPage title="Return Policy"
    intro={`${BRAND.name} is built around returns being easy. Here is exactly how and when you can return items.`}
    sections={[
      { h: 'Return at the door (Try & Buy)', p: ['When your rider arrives, try your items on. Anything that does not fit or you do not want, hand straight back to the rider. No forms, no trips, no waiting.'] },
      { h: 'After delivery returns', p: ['If you kept an item and change your mind, you can request a return within 3 days of delivery, provided the item is unused, unwashed, and has original tags attached.'] },
      { h: 'What cannot be returned', p: [['Innerwear, socks and swimwear (hygiene reasons)', 'Items without original tags or in used/washed condition', 'Items marked "Final sale"']] },
      { h: 'Condition of returned items', p: ['Returned products must be in original condition with tags. Our rider or team may decline a return that shows signs of use, damage or missing tags.'] },
      { h: 'Return pickups', p: [`For after-delivery returns, we arrange a pickup within ${BRAND.city}. Contact ${BRAND.email} or ${BRAND.phone} with your order code to start a return.`] },
    ]} />;
}
