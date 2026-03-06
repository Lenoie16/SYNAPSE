
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        hack: {
          bg: 'rgb(var(--hack-bg) / <alpha-value>)',
          surface: 'rgb(var(--hack-surface) / <alpha-value>)',
          border: 'rgb(var(--hack-border) / <alpha-value>)',
          primary: 'rgb(var(--hack-primary) / <alpha-value>)',
          secondary: 'rgb(var(--hack-secondary) / <alpha-value>)',
          accent: 'rgb(var(--hack-accent) / <alpha-value>)',
          danger: 'rgb(var(--hack-danger) / <alpha-value>)',
          text: 'rgb(var(--hack-text) / <alpha-value>)',
          muted: 'rgb(var(--hack-muted) / <alpha-value>)'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 10s linear infinite',
        'text-shimmer': 'textShimmer 4s linear infinite',
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        textShimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        spotlight: {
          '0%': { opacity: 0, transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: 1, transform: 'translate(-50%,-40%) scale(1)' }
        },
        glowPulse: {
          '50%': { opacity: '0.7' }
        }
      }
    }
  },
  plugins: [],
}