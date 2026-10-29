'use client';
import Link from 'next/link';
import Carousel from './Carousel';

// Brand-designed 16:9 hero banners (1672×941). The posters carry their own
// headline, offer and CTA, so NOTHING may be cropped. The box always keeps the
// poster's exact ratio; on a laptop, instead of cutting the top and bottom off
// to fit the screen height, the whole banner is scaled down (narrower) so it
// fits above the fold in full.
const SLIDES = [
  { img: '/banners/diwali.jpg', href: '/products', alt: 'OneT India Diwali Sale — up to 60% off festive fashion, delivered in minutes in Gwalior' },
  { img: '/banners/try-then-buy.jpg', href: '/products', alt: 'First Try Then Buy — OneT India' },
  { img: '/banners/good-vibes.jpg', href: '/products', alt: 'Fashion delivered to your door — OneT India' },
  { img: '/banners/zero-delivery.jpg', href: '/products', alt: '₹0 Delivery Fees on orders above ₹1000' },
  { img: '/banners/free-returns.jpg', href: '/products', alt: 'Free Returns — Hassle-free process' },
];

export default function Hero() {
  return (
    <section
      className="mx-auto w-full px-3 sm:px-5 pt-4"
      // width so that (width × 941/1672) + header never exceeds the screen
      style={{ maxWidth: 'min(1400px, calc((100svh - 150px) * 1.7769 + 40px))' }}
    >
      <Carousel autoPlay={4200} pauseOnHover={false} rounded="rounded-2xl sm:rounded-[1.5rem]" className="shadow-card">
        {SLIDES.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="block relative w-full aspect-[1672/941] bg-[#F5EFE6]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.img} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
