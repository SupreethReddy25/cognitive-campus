/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#1E1E2E',
        accent: '#00D4AA',
        surface: '#2A2A3E',
        muted: '#A0A0B0'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
