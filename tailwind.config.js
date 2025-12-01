/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/app.vue',
    './app/error.vue',
    './app/pages/**/*.vue',
    './app/layouts/**/*.vue',
    './app/components/**/*.{vue,js,ts}', // if you later add components/
    './app/composables/**/*.{js,ts}',
    './app/plugins/**/*.{js,ts}',
    './app/middleware/**/*.{js,ts}',
    './app/stores/**/*.{js,ts,vue}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f6f7',
          100: '#cfe7e9',
          200: '#a4d4d7',
          300: '#6fbbc1',
          400: '#3aa1aa',
          500: '#1b8790',
          600: '#016d77',
          700: '#075860',
          800: '#0a454c',
          900: '#09363b',
        },
        secondary: {
          50:  '#fff5f1',
          100: '#ffe5db',
          200: '#ffcab9',
          300: '#ffac92',
          400: '#ff946f',
          500: '#ff845a',
          600: '#fb8d68',
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
          500: '#1b8790',
          600: '#016d77',
          700: '#075860',
          800: '#0a454c',
          900: '#09363b',
        },
        accent: {
          50:  '#fff5f1',
          100: '#ffe5db',
          200: '#ffcab9',
          300: '#ffac92',
          400: '#ff946f',
          500: '#ff845a',
          600: '#fb8d68',
          700: '#e56a3d',
          800: '#b94f2a',
          900: '#7a331b',
        },
      },
    },
  },
  plugins: [],
  // If you build classes dynamically, safelist them (optional):
  // safelist: [{ pattern: /(bg|text|border)-(red|green|blue|yellow)-(100|300|500|700)/ }]
}
