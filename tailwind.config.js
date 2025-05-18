/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      md2: '1080px',
      lg: '1024px',
      xl: '1280px'
    },
    extend: {
      width: {
        '110': '27.5rem',  // 440px
        '115': '28.75rem', // 460px
        '120': '30rem',    // 480px
        '125': '31.25rem', // 500px
      },
      backgroundColor: {
        'main-bg': '#FAFBFB',
        'main-dark-bg': '#191a1a',
        'secondary-dark-bg': '#232726',
        'light-gray': '#EFEFEF',
        'half-transparent': 'rgba(0, 0, 0, 0.5)',
      },
      animationDelay: {
        '50': '50ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        appear: {
          '0%': { transform: 'translateY(-50px)', opacity: '0' },
          '100%': { transform: 'translateY(5px)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        appear: 'appear 0.5s ease forwards',
        fadeIn: 'fadeIn 0.25s ease-in-out',
      },
      transformOrigin: {
        'center': 'center',
      },
      scale: {
        '0': '0',
        '100': '1',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-50': {
          'animation-delay': '50ms',
        },
        '.animation-delay-100': {
          'animation-delay': '100ms',
        },
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-200': {
          'animation-delay': '200ms',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
  ],
  corePlugins: {
    preflight: false
  },
}
