/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rave: {
          bg: '#0a0a0f',
          card: '#13131d',
          surface: '#1b1b2a',
          border: '#27273d',
          purple: '#8b5cf6',
          violet: '#7c3aed',
          pink: '#ec4899',
          cyan: '#06b6d4',
          neon: '#10b981',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-bounce': 'wave-bounce 1s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        'wave-bounce': {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
