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
        background: '#000000', // Pure black
        foreground: '#FFFFFF', // Pure white
        'gray-dark': '#111111',
        'gray-medium': '#222222',
        'gray-light': '#333333',
      },
      fontFamily: {
        'google-sans': ['"Google Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}