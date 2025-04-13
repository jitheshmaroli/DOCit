/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          600: '#1CA2CF', // The teal/blue color from your design
        },
      },
    },
  },
  plugins: [],
};
