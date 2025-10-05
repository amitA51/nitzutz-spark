/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Professional blue
        'primary-light': '#818CF8', // Gradient end color
        background: '#000000', // Pure black
        foreground: '#FFFFFF', // Pure white
        'gray-dark': '#111111',
        'gray-medium': '#222222',
        'gray-light': '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // UI Font
        serif: ['IBM Plex Serif', 'Georgia', 'serif'], // Body Font
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(to right, #3B82F6, #818CF8)',
        'gradient-accent-hover': 'linear-gradient(to right, #2563EB, #6366F1)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}