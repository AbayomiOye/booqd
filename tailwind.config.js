/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4ff',
          100: '#f9e8ff',
          200: '#f2d0fe',
          300: '#e9a8fc',
          400: '#da72f8',
          500: '#c44fed',
          600: '#a62fd1',
          700: '#8b24ae',
          800: '#74218e',
          900: '#601e72',
        },
        gold: {
          400: '#f5c842',
          500: '#e8b93a',
          600: '#c99b2c',
        },
      },
    },
  },
  plugins: [],
}
