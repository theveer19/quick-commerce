import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Privacy Policy' };
export default function Page() {
  return <LegalPage title="Privacy Policy"
    intro={`This policy explains what information ${BRAND.name} collects, why, and how we protect it.`}
    sections={[
      { h: 'Information we collect', p: [['Contact details: name and mobile number', 'Delivery details: address, landmark, pincode', 'Order details: items, amounts, payment status', 'Technical data: device and usage information to improve the app']] },
      { h: 'How we use your information', p: [['To process, deliver and track your orders', 'To provide customer support and handle returns/refunds', 'To send order updates and, with consent, offers', 'To improve our products, service and delivery']] },
      { h: 'Payments', p: ['Online payments are processed securely by Razorpay. We do not store your full card or bank details on our servers. Razorpay handles payment data under its own security standards and compliance.'] },
      { h: 'Data sharing', p: ['We share delivery details with our riders only to fulfil your order. We do not sell your personal data. We may share data with service providers (like payments and hosting) strictly to run the service, and with authorities where legally required.'] },
      { h: 'Data security', p: ['We use industry-standard measures to protect your data, including encrypted connections and access controls. No method is 100% secure, but we work continuously to safeguard your information.'] },
      { h: 'Your rights', p: [`You can request access to, correction of, or deletion of your personal data by contacting ${BRAND.email}.`] },
      { h: 'Cookies', p: ['We use minimal cookies/local storage to keep your cart and session working. You can clear these anytime from your browser.'] },
    ]} />;
}
