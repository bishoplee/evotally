/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/app.vue',
    './app/error.vue',
    './app/pages/**/*.vue',
    './app/layouts/**/*.vue',
    './app/components/**/*.{vue,js,ts}',
    './app/composables/**/*.{js,ts}',
    './app/plugins/**/*.{js,ts}',
    './app/middleware/**/*.{js,ts}',
    './app/stores/**/*.{js,ts,vue}',
  ],
  theme: {
    extend: {
      colors: {
        // Evotally Teal Scale
        teal: {
          900: '#024A51',
          800: '#006D77',
          600: '#00A8B5',
          500: '#00B7B9',
          400: '#00CED1',
        },
        // Evotally Coral CTAs
        coral: {
          500: '#FF8D68',
          400: '#FB7A57',
        },
        // Evotally Gradient Colors (for Evo Orb)
        magenta: {
          500: '#FF3CAC',
        },
        purple: {
          600: '#A938AC',
        },
        'teal-accent': '#00A1A8',
        // Evotally Neutrals
        gray: {
          50: '#F5F5F5',
          150: '#E0E0E0',
          300: '#A6A6A6',
          900: '#111827',
        },
        // Legacy support (map to new colors)
        primary: {
          50:  '#f0f6f7',
          100: '#cfe7e9',
          200: '#a4d4d7',
          300: '#6fbbc1',
          400: '#3aa1aa',
          500: '#1b8790',
          600: '#006D77', // Teal 800
          700: '#024A51', // Teal 900
          800: '#024A51',
          900: '#024A51',
        },
        secondary: {
          50:  '#fff5f1',
          100: '#ffe5db',
          200: '#ffcab9',
          300: '#ffac92',
          400: '#ff946f',
          500: '#FF8D68', // Coral 500
          600: '#FB7A57', // Coral 400
          700: '#e56a3d',
          800: '#b94f2a',
          900: '#7a331b',
        },
        brand: {
          50:  '#f0f6f7',
          100: '#cfe7e9',
          200: '#a4d4d7',
          300: '#6fbbc1',
          400: '#3aa1aa',
          500: '#00B7B9', // Teal 500
          600: '#00A8B5', // Teal 600
          700: '#006D77', // Teal 800
          800: '#024A51', // Teal 900
          900: '#024A51',
        },
        accent: {
          50:  '#fff5f1',
          100: '#ffe5db',
          200: '#ffcab9',
          300: '#ffac92',
          400: '#ff946f',
          500: '#FF8D68', // Coral 500
          600: '#FB7A57', // Coral 400
          700: '#e56a3d',
          800: '#b94f2a',
          900: '#7a331b',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        // Evotally Typography Scale
        // Format: [fontSize, { lineHeight, letterSpacing }]
        'hero-desktop': ['56px', { lineHeight: '1.15' }],
        'hero-tablet': ['44px', { lineHeight: '1.15' }],
        'hero-mobile': ['36px', { lineHeight: '1.2' }],
        'h2-desktop': ['36px', { lineHeight: '1.2' }],
        'h2-tablet': ['32px', { lineHeight: '1.2' }],
        'h2-mobile': ['28px', { lineHeight: '1.2' }],
        'h3-desktop': ['24px', { lineHeight: '1.25' }],
        'h3-tablet': ['22px', { lineHeight: '1.25' }],
        'h3-mobile': ['20px', { lineHeight: '1.25' }],
        'h4-desktop': ['20px', { lineHeight: '1.3' }],
        'h4-tablet': ['18px', { lineHeight: '1.3' }],
        'h4-mobile': ['18px', { lineHeight: '1.3' }],
      },
      spacing: {
        // Evotally Spacing Scale
        'section-desktop': '80px',
        'section-tablet': '64px',
        'section-mobile': '48px',
        'hero-desktop': '96px',
        'hero-tablet': '80px',
        'hero-mobile': '64px',
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 10px 24px rgba(17, 24, 39, 0.10)',
      },
      maxWidth: {
        'container-desktop': '1120px',
        'container-tablet': '880px',
      },
    },
  },
  plugins: [],
}
