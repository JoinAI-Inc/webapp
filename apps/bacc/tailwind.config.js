/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'cny-red': {
          DEFAULT: '#B31C0F',
          dark: '#7D140B',
          light: '#D43D2F',
        },
        'cny-gold': {
          DEFAULT: '#D4AF37',
          light: '#F4CF67',
          dark: '#A68928',
        },
        'cny-ivory': '#FDFCF0',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
    },
  },
  plugins: [],
}
