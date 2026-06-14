/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2f7',
          100: '#dce4f0',
          200: '#b8c8e0',
          300: '#8aa2c8',
          400: '#5a7eb0',
          500: '#3a5e90',
          600: '#2d4a72',
          700: '#243a5a',
          800: '#1b2b44',
          900: '#151e30',
          950: '#0f1623',
        },
        signal: {
          50: '#fdf8ed',
          100: '#f9edcf',
          200: '#f3d99b',
          300: '#ecc066',
          400: '#e6a63c',
          500: '#dd8f24',
          600: '#c4701b',
          700: '#a35319',
          800: '#85411b',
          900: '#6e3619',
          950: '#3e1b09',
        },
        sand: {
          50: '#faf8f5',
          100: '#f2efea',
          200: '#e6e1d9',
          300: '#d4cdc1',
          400: '#b8aea0',
          500: '#a49888',
          600: '#8e8070',
          700: '#766a5d',
          800: '#63594f',
          900: '#534b43',
          950: '#2c2723',
        },
      },
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['"Cairo"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.25rem, 5vw + 0.5rem, 4rem)', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '800' }],
        'headline': ['clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title': ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.65', fontWeight: '400' }],
        'label': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      borderRadius: {
        'subtle': '6px',
        'soft': '10px',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'chat-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'chat-fade-up': 'chat-fade-up 300ms cubic-bezier(0.25, 1, 0.5, 1) both',
        'cursor-blink': 'cursor-blink 800ms step-end infinite',
      },
    },
  },
  plugins: [],
}
