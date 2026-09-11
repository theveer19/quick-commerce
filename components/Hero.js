'use client';
import Link from 'next/link';
import Carousel from './Carousel';

// Brand-designed 16:9 hero banners. On desktop the height is capped to the
// viewport so the whole banner fits above the fold (no scrolling); on mobile
// it keeps the natural 16:9 ratio. object-cover fills edge-to-edge.
const SLIDES = [
  { img: '/banners/try-then-buy.jpg', href: '/products', alt: 'First Try Then Buy — OneT India' },
  { img: '/banners/good-vibes.jpg', href: '/products', alt: 'Fashion delivered to your door — OneT India' },
  { img: '/banners/ganesh.jpg', href: '/offers', alt: 'Ganesh Chaturthi Sale — OneT India' },
  { img: '/banners/zero-delivery.jpg', href: '/products', alt: '₹0 Delivery Fees on orders above ₹1000' },
  { img: '/banners/free-returns.jpg', href: '/products', alt: 'Free Returns — Hassle-free process' },
];

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1400px] px-3 sm:px-5 pt-4">
      <Carousel autoPlay={4200} pauseOnHover={false} rounded="rounded-2xl sm:rounded-[1.5rem]" className="shadow-card">
        {SLIDES.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="block relative w-full aspect-[16/9] sm:aspect-auto sm:h-[calc(100svh-150px)] sm:min-h-[360px] sm:max-h-[720px] bg-[#F5EFE6]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.img} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
