// "Get it on Google Play" button. Drawn in code (no external image) so it
// always loads and matches the site; the triangle uses Play's four colours.
import { PLAY_STORE_URL } from '@/lib/config';

export default function PlayBadge({ className = '', onClick, small = false }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label="Get OneT India on Google Play"
      className={`inline-flex items-center gap-2.5 rounded-xl bg-black text-white ${small ? 'px-3 py-1.5' : 'px-4 py-2.5'} hover:bg-black/85 transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 26" className={small ? 'w-4 h-4' : 'w-5 h-5'} aria-hidden="true">
        <path d="M1.2.6 13.5 13 1.2 25.4c-.4-.3-.7-.8-.7-1.4V2c0-.6.3-1.1.7-1.4Z" fill="#34A853" />
        <path d="M17.6 8.9 13.5 13 1.2.6c.3-.2.8-.3 1.2-.1l15.2 8.4Z" fill="#4285F4" />
        <path d="M17.6 17.1 2.4 25.5c-.4.2-.9.1-1.2-.1L13.5 13l4.1 4.1Z" fill="#EA4335" />
        <path d="M22.4 11.5c.9.5.9 2.5 0 3l-4.8 2.6L13.5 13l4.1-4.1 4.8 2.6Z" fill="#FBBC04" />
      </svg>
      <span className="leading-none text-left">
        <span className={`block uppercase tracking-wide opacity-80 ${small ? 'text-[8px]' : 'text-[9px]'}`}>Get it on</span>
        <span className={`block font-semibold ${small ? 'text-sm' : 'text-[15px]'}`}>Google Play</span>
      </span>
    </a>
  );
}
