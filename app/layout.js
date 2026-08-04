import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { BRAND } from '@/lib/config';

export const metadata = {
  title: {
    default: `${BRAND.name} — Fashion delivered in minutes | Gwalior`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Gwalior's fastest fashion delivery. Try-then-buy, delivered to your door in minutes. Women, men, footwear, ethnic & accessories.",
  keywords: ['Gwalior fashion delivery', 'quick commerce Gwalior', 'try then buy', 'OneT India'],
  openGraph: {
    title: `${BRAND.name} — Fashion delivered in minutes`,
    description: "Gwalior's fastest fashion delivery. Try-then-buy in minutes.",
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: '#111015', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body grain min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 relative z-[2]">{children}</main>
        <Footer />
        <AuthModal />
      </body>
    </html>
  );
}
