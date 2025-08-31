/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TradeZella renk paleti
        'bg': '#F6F7FB',
        'card': '#FFFFFF',
        'text': '#0F172A',
        'primary': {
          DEFAULT: '#6B5BFF',
          light: '#9B8CFF',
          dark: '#4C3BCC',
        },
        'sidebar': {
          'from': '#0B1B4A',
          'to': '#331C7A',
        },
        'pnl': {
          'positive': '#16A34A',
          'negative': '#DC2626',
        },
        'muted': '#94A3B8',
        'border': '#E2E8F0',
        // Neutral renk skalası
        'neutral': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
