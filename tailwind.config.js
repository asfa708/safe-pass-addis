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
          900: '#000a14',  // deep space — body background
          800: '#011020',  // panels, sidebar, cards
          700: '#01192e',  // inputs, secondary surfaces
          600: '#0a2540',  // borders, dividers
        },
        gold: {
          400: '#67e8f9',  // lighter cyan — secondary text accents
          500: '#00d4ff',  // electric cyan — primary accent
          600: '#009dc5',  // darker cyan — hover / active states
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
