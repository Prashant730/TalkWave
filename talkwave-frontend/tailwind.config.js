/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: '#6c63ff',
        surface: '#12121a',
        surface2: '#1a1a26',
        border: '#2a2a3d',
        muted: '#8888aa',
      },
    },
  },
  plugins: [],
}
