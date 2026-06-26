/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand palette — adjust as the design firms up.
        primary: '#208AEF',
        ink: '#23205C',
      },
    },
  },
  plugins: [],
};
