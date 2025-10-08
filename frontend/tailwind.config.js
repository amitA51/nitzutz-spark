/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Semantic color tokens mapped to CSS variables (Preset A - Neo-glassmorphism)
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-text)',
        overlay: 'var(--color-overlay)',
        surface: {
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
        },
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          contrast: 'var(--color-primary-contrast)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          contrast: 'var(--color-primary-contrast)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          contrast: 'var(--color-accent-contrast)',
        },
        muted: 'var(--color-muted)',

        // Legacy aliases retained for existing styles
        'gray-dark': 'var(--color-gray-dark)',
        'gray-medium': 'var(--color-gray-medium)',
        'gray-light': 'var(--color-gray-light)',

        // Status colors (fixed)
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#F43F5E',
        info: '#38BDF8',
      },

      fontFamily: {
        // UI font
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Display font for hero/headings
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        // Existing serif for content (kept)
        serif: ['IBM Plex Serif', 'Georgia', 'serif'],
      },

      // Signature radii (Preset A)
      borderRadius: {
        md: '14px',
        lg: '20px',
        xl: '28px',
      },

      // Elevation shadows (soft, color-aware)
      boxShadow: {
        'elevation-1': '0 1px 2px -1px rgba(0,0,0,0.25), 0 1px 3px rgba(2,6,23,0.25)',
        'elevation-2': '0 6px 20px rgba(2,6,23,0.35), 0 0 1px rgba(79,70,229,0.08)',
        'elevation-3': '0 14px 40px rgba(2,6,23,0.45), 0 0 1px rgba(79,70,229,0.12)',
      },

      // Glass blur tokens
      backdropBlur: {
        'glass-sm': '8px',
        'glass-md': '12px',
        'glass-lg': '18px',
      },

      // Gradients (keep existing utility names; swap to semantic variables)
      backgroundImage: {
        'gradient-accent': 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
        'gradient-accent-hover': 'linear-gradient(to right, var(--color-primary-hover), var(--color-accent-hover))',

        // New semantic names if needed later
        'gradient-brand': 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
        'gradient-brand-hover': 'linear-gradient(to right, var(--color-primary-hover), var(--color-accent-hover))',
      },

      // Motion tokens (durations)
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '280ms',
      },
    },
  },
  plugins: [],
}