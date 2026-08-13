'use client';
import Link from 'next/link';

const uns = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=300&q=70`;

const CIRCLES = [
  { name: "Women's Wear", href: '/products?category=women', img: uns('photo-1483985988355-763728e1935b') },
  { name: "Men's Wear", href: '/products?category=men', img: uns('photo-1516257984-b1b4d707412e') },
];

export default function CategoryCircles() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
      <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar pb-2 sm:justify-center">
        {CIRCLES.map((c) => (
          <Link key={c.name} href={c.href} className="shrink-0 text-center group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-lilacbg shadow-soft group-hover:border-violet transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-ivory">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}