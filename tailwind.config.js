/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // semantic (soft pastel theme)
        ink: '#F7F5FF',        // app base + input insets
        surface: '#FFFFFF',    // cards
        'surface-2': '#FBFAFF',
        ivory: '#2B2543',      // primary text
        muted: '#8B87A3',      // muted text
        rose: '#7C68E6',       // PRIMARY (soft lavender-violet)
        violet: '#B9A7F5',     // secondary lilac
        mint: '#10B981',       // success (kept readable)
        line: 'rgba(43,37,72,0.08)',
        // brand purples (softened)
        plum: '#5B4B9E',
        grape: '#7C5FD6',
        lilacbg: '#EFEAFF',
        // pastels
        pink: '#FFE3EF',
        'pink-ink': '#D6608C',
        peach: '#FFEBDD',
        'peach-ink': '#E08A54',
        sky: '#E1EEFF',
        'sky-ink': '#5B8FD6',
        mintbg: '#DDF7EC',
        lemon: '#FFF4CE',
        'lemon-ink': '#C2A24B',
        // independence day
        saffron: '#FFB566',
        indiagreen: '#4CAF7D',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        glow: '0 10px 40px -12px rgba(124,104,230,0.4)',
        card: '0 12px 40px -18px rgba(91,75,158,0.22)',
        soft: '0 6px 24px -10px rgba(91,75,158,0.14)',
        pop: '0 20px 60px -22px rgba(124,104,230,0.42)',
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
