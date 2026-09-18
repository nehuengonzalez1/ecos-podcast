import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#171717',
          600: '#1f1f1f',
          500: '#2a2a2a',
        },
        cream: {
          50: '#faf3e3',
          100: '#f5e9d3',
          200: '#e6d5b3',
          300: '#c7b58f',
          400: '#8f8168',
        },
        gold: {
          DEFAULT: '#ff8000',
          light: '#ffa040',
          dark: '#b05800',
        },
        muted: '#3d2f1e',
      },
      // '"LQLVE Cifras"' va primera en todos los stacks salvo el sans, que
      // ya es Inter. No es una fuente completa: solo tiene los digitos (ver
      // el @font-face en globals.css), asi que el navegador la usa para las
      // cifras y cae en la siguiente de la lista para todo lo demas. Es lo
      // que mantiene los numeros iguales en todo el sitio.
      fontFamily: {
        serif: ['"LQLVE Cifras"', '"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hand: ['"LQLVE Cifras"', 'Caveat', 'cursive'],
        // Títulos.
        display: ['"LQLVE Cifras"', 'Now', '"Cormorant Garamond"', 'serif'],
        // Subtítulos.
        signature: ['"LQLVE Cifras"', '"Brother Signature"', 'cursive'],
      },
      backgroundImage: {
        'kraft':
          'linear-gradient(135deg, #8a6f45 0%, #6b5638 45%, #4b3d29 100%)',
      },
      boxShadow: {
        soft: '0 20px 60px -20px rgba(0,0,0,0.6)',
        polaroid: '0 22px 45px -18px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4)',
        stamp: 'inset 0 0 0 2px rgba(255,128,0,0.7)',
      },
      keyframes: {
        floatSlow: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '45%': { opacity: '0.92' },
          '55%': { opacity: '1' },
        },
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
