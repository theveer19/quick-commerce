/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── OneT brand palette ──
        ink: '#F7F5FF',        // app base bg
        surface: '#FFFFFF',    // Pure White — cards
        'surface-2': '#FBF9FF',
        ivory: '#17142B',      // Trust Navy — primary text
        muted: '#8B87A3',      // muted text
        rose: '#6D22D9',       // PRIMARY — Royal Purple (buttons/logo)
        violet: '#A855F7',     // Lavender — secondary
        grape: '#8B3DFF',      // Electric Purple
        plum: '#3B0A8F',       // Deep Purple — depth/headlines
        lilacbg: '#EDE5FF',    // Soft Lavender — section bg
        mint: '#10B981',       // success
        line: 'rgba(23,20,43,0.10)',
        // accents
        fashionpink: '#F43F8F',
        softpink: '#FCE7F3',
        gold: '#F4B942',
        cloud: '#F4F3F7',
        // pastels (kept)
        pink: '#FCE7F3',
        'pink-ink': '#D6608C',
        peach: '#FFEBDD',
        'peach-ink': '#E08A54',
        sky: '#E1EEFF',
        'sky-ink': '#5B8FD6',
        mintbg: '#DDF7EC',
        lemon: '#FFF4CE',
        'lemon-ink': '#C2A24B',
        // independence day
        saffron: '#FF9933',
        indiagreen: '#138808',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #3B0A8F 0%, #6D22D9 50%, #A855F7 100%)',
      },
      boxShadow: {
        glow: '0 10px 40px -12px rgba(109,34,217,0.42)',
        card: '0 12px 40px -18px rgba(59,10,143,0.22)',
        soft: '0 6px 24px -10px rgba(59,10,143,0.14)',
        pop: '0 20px 60px -22px rgba(109,34,217,0.42)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseRing: { '0%': { transform: 'scale(0.9)', opacity: '0.7' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
      },
      animation: {
        marquee: 'marquee 26s linear infinite',
        float: 'float 6s ease-in-out infinite',
        pulseRing: 'pulseRing 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};