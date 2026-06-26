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
        // Mirror of `Brand` in src/constants/theme.ts — keep in sync.
        brand: {
          navy: '#2E2B5E',
          indigo: '#4B45C4',
          blue: '#208AEF',
          'blue-light': '#6FB2FF',
          gold: '#F8B81B',
          night: '#0B0A18',
          mist: '#E8EBF3',
          muted: '#7E83A8',
        },
      },
    },
  },
  plugins: [],
};
