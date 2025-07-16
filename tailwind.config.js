
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // THIS LINE IS CRUCIAL
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'], 
          },
    
          colors: {
            'chef-primary': '#D17557',
            'chef-dark': '#141413',
            'chef-light-bg': '#F0EFEB',
          },
        },
      }
    },
  },
  plugins: [],
}