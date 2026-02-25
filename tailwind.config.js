/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
        },
        gold: {
          400: '#FFE033',
          500: '#FFD700',
          600: '#CCAC00',
        }
      },
    },
  },
  plugins: [],
}
