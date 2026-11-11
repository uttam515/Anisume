/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0D100F',
          900: '#171B1A', // Deep Ink
          850: '#1F2423',
          800: '#282F2D', // Elevated surface
          750: '#333C39',
          700: '#414C49',
          600: '#55625E',
          500: '#637D74',
        },
        brand: {
          DEFAULT: '#6366F1', // Primary Indigo
          indigo: '#6366F1',
          violet: '#8B5CF6',
          emerald: '#20B486',
          sky: '#55BCEB',
          pink: '#F16AAB',
          yellow: '#F4C95D',
          orange: '#FF8A3D',
          cream: '#FFF5E8',
          ink: '#171B1A',
          surface: '#222725',
          border: '#333B38',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          emerald: '#20B486',
          blue: '#55BCEB',
          pink: '#F16AAB',
          yellow: '#F4C95D',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Outfit',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        japanese: [
          'Dela Gothic One',
          'Noto Sans JP',
          'Hiragino Kaku Gothic ProN',
          'Meiryo',
          'Yu Gothic',
          'sans-serif',
        ],
        display: ['Bebas Neue', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        indigo: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'indigo-lg': '0 0 40px -10px rgba(99, 102, 241, 0.45)',
        emerald: '0 0 25px -5px rgba(32, 180, 134, 0.35)',
        sky: '0 0 25px -5px rgba(85, 188, 235, 0.35)',
      },
      aspectRatio: {
        poster: '2 / 3',
        banner: '16 / 9',
        cinematic: '21 / 9',
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        'marquee-reverse': 'marquee-reverse 35s linear infinite',
        'shimmer-slide': 'shimmer-slide 2.5s ease-in-out infinite alternate',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'petal-drift': 'petalDrift 10s linear infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          from: { transform: 'translateX(-50%)' },
          to: { transform: 'translateX(0)' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        petalDrift: {
          '0%': { transform: 'translate3d(0, -10px, 0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.8' },
          '100%': { transform: 'translate3d(80px, 600px, 0) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
