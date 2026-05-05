/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dragon-black': '#0B0B0D',
        'deep-black': '#111111',
        'dragon-gold': '#D4AF37',
        'light-gold': '#F4E5B1',
      },
    },
  },
  plugins: [],
};
