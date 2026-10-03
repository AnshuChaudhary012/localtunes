/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: 'rgb(var(--color-bg-primary-rgb) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface-rgb) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card-rgb) / <alpha-value>)',
          cardHover: 'rgb(var(--color-bg-card-hover-rgb) / <alpha-value>)',
          border: 'var(--color-border)',
          muted: 'var(--color-text-muted)',
          subtext: 'var(--color-text-subtext)'
        },
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          purple: '#8b5cf6',
          pink: '#ec4899'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        'glow': '0 0 25px -5px var(--color-accent-glow)',
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
