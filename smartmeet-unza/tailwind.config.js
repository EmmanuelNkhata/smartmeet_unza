/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./admin/**/*.{html,js}",
    "./user-ui/**/*.{html,js}",
    "./public/**/*.{html,js}",
    "./src/**/*.css",
    "./*.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
