'use client';
import { useEffect, useRef, useState } from 'react';
import { Phone, Bike, Store, MapPin } from 'lucide-react';
import { BRAND } from '@/lib/config';

// progress fraction per status
const PROGRESS = {
  placed: 0.06,
  confirmed: 0.22,
  packed: 0.4,
  out_for_delivery: 0.82,
  delivered: 1,
  cancelled: 0,
};

// the delivery route (store -> home) inside a 400x260 viewBox
const ROUTE = 'M 44 210 C 120 210, 120 90, 210 90 S 300 60, 356 54';

export default function MapTracker({ status = 'confirmed', etaMinutes = BRAND.etaMinutes, rider }) {
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const [frac, setFrac] = useState(0.02);
  const target = PROGRESS[status] ?? 0.1;

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);

  // ease toward target fraction
  useEffect(() => {
    let raf;
    const tick = () => {
      setFrac((f) => {
        const next = f + (target - f) * 0.06;
        if (Math.abs(target - next) < 0.001) return target;
        raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const pt = (len && pathRef.current) ? pathRef.current.getPointAtLength(frac * len) : { x: 44, y: 210 };
  const done = status === 'delivered';
  const cancelled = status === 'cancelled';

  const riderName = rider?.name || 'Aarav';
  const riderPhone = rider?.phone || BRAND.phone;

  return (
    <div className="rounded-xl2 overflow-hidden border border-line bg-white shadow-card">
      {/* MAP */}
      <div className="relative bg-lilacbg grid-bg">
        {/* soft park / block shapes for a map feel */}
        <svg viewBox="0 0 400 260" className="w-full block" style={{ aspectRatio: '400/260' }}>
          {/* blocks */}
          <g opacity="0.5">
            <rect x="30" y="30" width="90" height="60" rx="10" fill="#E4DBFF" />
            <rect x="150" y="24" width="70" height="46" rx="10" fill="#FFE0EC" />
            <rect x="250" y="30" width="120" height="54" rx="10" fill="#DCEBFF" />
            <rect x="30" y="120" width="70" height="110" rx="10" fill="#D6F7EA" />
            <rect x="250" y="120" width="120" height="110" rx="10" fill="#EDE7FF" />
            <rect x="130" y="150" width="90" height="80" rx="10" fill="#FFF3C9" />
          </g>
          {/* roads */}
          <g stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.9">
            <line x1="0" y1="105" x2="400" y2="105" />
            <line x1="120" y1="0" x2="120" y2="260" />
            <line x1="235" y1="0" x2="235" y2="260" />
          </g>

          {/* full route (dashed) */}
          <path d={ROUTE} fill="none" stroke="#B9A7F0" strokeWidth="4" strokeDasharray="2 8" strokeLinecap="round" />
          {/* progress route (solid) */}
          <path ref={pathRef} d={ROUTE} fill="none" stroke="#7A46F5" strokeWidth="4" strokeLinecap="round"
            style={{ strokeDasharray: len, strokeDashoffset: len ? len * (1 - frac) : 0 }} />

          {/* store pin */}
          <g transform="translate(44,210)">
            <circle r="14" fill="#fff" stroke="#7A46F5" strokeWidth="2" />
          </g>
          {/* home pin */}
          <g transform="translate(356,54)">
            <circle r="16" fill="#7A46F5" className={done ? '' : 'animate-pulse'} />
            <circle r="26" fill="none" stroke="#7A46F5" strokeWidth="2" opacity="0.4" className="animate-pulseRing" style={{ transformOrigin: 'center' }} />
          </g>

          {/* rider */}
          {!cancelled && !done && (
            <g transform={`translate(${pt.x},${pt.y})`}>
              <circle r="15" fill="#FF6FB0" />
              <circle r="15" fill="none" stroke="#fff" strokeWidth="2.5" />
            </g>
          )}
        </svg>

        {/* pin icons overlaid (crisp lucide) */}
        <div className="absolute" style={{ left: '11%', top: '80.7%', transform: 'translate(-50%,-50%)' }}>
          <Store size={13} className="text-rose" />
        </div>
        <div className="absolute" style={{ left: '89%', top: '20.7%', transform: 'translate(-50%,-50%)' }}>
          <MapPin size={16} className="text-white" />
        </div>
        {!cancelled && !done && (
          <div className="absolute transition-all" style={{ left: `${(pt.x / 400) * 100}%`, top: `${(pt.y / 260) * 100}%`, transform: 'translate(-50%,-50%)' }}>
            <Bike size={15} className="text-white" />
          </div>
        )}

        {/* ETA chip */}
        {!done && !cancelled && (
          <div className="absolute top-3 left-3 bg-white rounded-full shadow-soft border border-line px-3 py-1.5 text-sm font-semibold text-plum flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" /> Arriving in ~{etaMinutes} min
          </div>
        )}
        {done && (
          <div className="absolute top-3 left-3 bg-mint text-white rounded-full shadow-soft px-3 py-1.5 text-sm font-semibold">Delivered 🎉</div>
        )}
        {cancelled && (
          <div className="absolute top-3 left-3 bg-rose text-white rounded-full shadow-soft px-3 py-1.5 text-sm font-semibold">Order cancelled</div>
        )}
      </div>

      {/* RIDER BAR */}
      {!cancelled && (
        <div className="flex items-center gap-3 p-4">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-lilacbg text-grape shrink-0"><Bike size={20} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ivory">{done ? 'Delivered by' : 'On the way'} · {riderName}</p>
            <p className="text-xs text-muted">{done ? 'Hope you love your fits!' : `Your rider is heading to you`}</p>
          </div>
          <a href={`tel:${riderPhone}`} className="grid place-items-center w-11 h-11 rounded-full bg-rose text-white shadow-glow hover:brightness-110 transition" aria-label="Call rider">
            <Phone size={18} />
          </a>
        </div>
      )}
    </div>
  );
}
