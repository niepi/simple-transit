/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'sbahn': '#008C4C',      // Green
        'ubahn': '#0067B3',      // Blue
        'tram': '#DC0000',       // Red
        'bus': '#7A28A3',        // Purple
        'ferry': '#00B7E5',      // Cyan
        'express': '#FFC107',    // Amber
        'regional': '#3F51B5',   // Indigo
      },
      backgroundColor: {
        'dark': '#1a1b1e',
        'dark-card': '#25262b',
        'dark-hover': '#2c2e33',
      },
      textColor: {
        'dark': '#c1c2c5',
        'dark-secondary': '#909296',
      },
    },
  },
  plugins: [],
}
