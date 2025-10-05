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
  theme: { extend: {} },
  plugins: [],
  // If you build classes dynamically, safelist them (optional):
  // safelist: [{ pattern: /(bg|text|border)-(red|green|blue|yellow)-(100|300|500|700)/ }]
}
