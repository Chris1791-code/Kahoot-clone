/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bk-navy': '#0A2540',
        'bk-sunrise': '#E0457B',
        'bk-coral': '#FF8966',
        'bk-gold': '#FFD166',
        'bk-sky': '#4FC3F7',
        'bk-offwhite': '#FAF0E6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming we use Inter
      }
    },
  },
  plugins: [],
}
