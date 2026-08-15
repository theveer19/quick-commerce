import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/config';
export const metadata = { title: 'Delete Your Account & Data' };
export default function Page() {
  return <LegalPage title="Delete Your Account & Data"
    intro={`This page explains how you can request deletion of your ${BRAND.name} account and the personal data associated with it. It applies to the ${BRAND.name} mobile app and website (onet.co.in), operated by OneT Vision.`}
    sections={[
      { h: 'How to request account deletion', p: [
        `To delete your ${BRAND.name} account and associated data, send a deletion request using any of the methods below:`,
        [`Email us at ${BRAND.email} from your registered email, or`, `Call or WhatsApp us at ${BRAND.phone}, or`, `Reply to any order message asking us to delete your account.`],
        'Please include the mobile number registered with your account so we can verify and locate it. We will confirm your request and complete the deletion within 7 working days.',
      ] },
      { h: 'What data is deleted', p: [
        'When you request deletion, we permanently remove the following personal data linked to your account:',
        ['Your name and phone number', 'Saved delivery addresses and location details', 'Your order history and saved preferences (wishlist, etc.)'],
      ] },
      { h: 'What data may be retained', p: [
        'For legal, tax and accounting reasons (as required under Indian law, including GST regulations), we may retain certain transaction and invoice records for the period required by law, even after your account is deleted. This retained data is not used to identify or contact you for marketing.',
      ] },
      { h: 'Time to process', p: [
        'Account deletion requests are verified and processed within 7 working days. You will receive a confirmation once your account and eligible data have been deleted.',
      ] },
      { h: 'Contact', p: [
        `For any questions about deleting your account or data, contact us at ${BRAND.email} or ${BRAND.phone}. Business hours: ${BRAND.workingHours}.`,
      ] },
    ]} />;
}