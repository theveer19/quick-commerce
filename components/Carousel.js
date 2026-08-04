'use client';
import { useEffect, useRef, useState, Children } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/format';

/**
 * Generic slide carousel. Pass slides as children.
 * props: autoPlay (ms | 0), showArrows, showDots, className, slideClass
 */
export default function Carousel({ children, autoPlay = 4500, pauseOnHover = true, showArrows = true, showDots = true, className = '', rounded = 'rounded-xl3' }) {
  const slides = Children.toArray(children);
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const startX = useRef(null);
  const n = slides.length;

  const go = (d) => setI((p) => (p + d + n) % n);
  const to = (idx) => setI(((idx % n) + n) % n);

  useEffect(() => {
    if (!autoPlay || (pauseOnHover && hover) || n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), autoPlay);
    return () => clearInterval(t);
  }, [autoPlay, pauseOnHover, hover, n]);

  const onStart = (e) => { startX.current = (e.touches ? e.touches[0].clientX : e.clientX); };
  const onEnd = (e) => {
    if (startX.current == null) return;
    const end = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
    const dx = end - startX.current;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  return (
    <div className={cx('relative overflow-hidden', rounded, className)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onStart} onMouseUp={onEnd}>
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <div key={idx} className="w-full shrink-0">{s}</div>
        ))}
      </div>

      {showArrows && n > 1 && (
        <>
          <button aria-label="Previous" onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full glass text-ivory shadow-soft hover:bg-white transition">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next" onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full glass text-ivory shadow-soft hover:bg-white transition">
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {showDots && n > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button key={idx} aria-label={`Go to slide ${idx + 1}`} onClick={() => to(idx)}
              className={cx('h-2 rounded-full transition-all', i === idx ? 'w-7 bg-white' : 'w-2 bg-white/60 hover:bg-white/80')} />
          ))}
        </div>
      )}
    </div>
  );
}
