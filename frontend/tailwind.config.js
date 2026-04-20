/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace'],
      },
      colors: {
        /* ── Superficies — escalas tinted frías ── */
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
        },
        /* ── Primario — Esmeralda ── */
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)',
        },
        /* ── Acento — Violeta ── */
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          light: 'rgb(var(--accent-light) / <alpha-value>)',
          400: '#8e76e6',
          500: '#6e56cf',
          600: '#5b42b8',
        },
        /* ── Ink — Escala de texto ── */
        ink: {
          950: '#08090d',
          900: '#0e0f15',
          800: '#14151e',
          700: '#1e2030',
          600: '#3a3c4e',
          500: '#63636e',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f0f0f2',
        },
        /* ── Funcionales (desaturados) ── */
        neon: {
          cyan: '#22d3ee',
          blue: '#60a5fa',
          purple: '#8b5cf6',
          pink: '#f472b6',
          orange: '#fb923c',
          green: '#34d399',
          red: '#f87171',
          yellow: '#fbbf24',
        },
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        'ticker': 'ticker 30s linear infinite',
        'confetti-fall': 'confetti-fall 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'page-in': 'page-in 0.35s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'reveal-up': 'reveal-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'spotlight': 'spotlight 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-40px) rotate(0deg) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(60px) rotate(720deg) scale(0)', opacity: '0' },
        },
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spotlight': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        /* Tinted shadows instead of pure black */
        'glow-sm': '0 0 12px -2px rgba(110, 86, 207, 0.25)',
        'glow-md': '0 0 24px -4px rgba(110, 86, 207, 0.35)',
        'glow-lg': '0 0 48px -8px rgba(110, 86, 207, 0.4)',
        'glow-cyan': '0 0 24px -4px rgba(34, 211, 238, 0.3)',
        'glow-green': '0 0 24px -4px rgba(52, 211, 153, 0.3)',
        'glow-orange': '0 0 24px -4px rgba(251, 146, 60, 0.3)',
        /* Tinted ambient shadow */
        'ambient': '0 8px 32px -8px rgba(8, 9, 13, 0.6), 0 2px 8px -2px rgba(8, 9, 13, 0.4)',
        'ambient-lg': '0 16px 48px -12px rgba(8, 9, 13, 0.7), 0 4px 12px -4px rgba(8, 9, 13, 0.5)',
        /* Inner highlight */
        'inner-light': 'inset 0 1px 1px rgba(255, 255, 255, 0.06)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-expo': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
