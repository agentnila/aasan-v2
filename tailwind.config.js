/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a3a6b',
        'columbia-blue': '#98c0de',
        gold: '#c8963c',
        bg: '#f8f9fb',
        card: '#ffffff',
        'text-primary': '#1a2e42',
        'chat-user': '#1a3a6b',
        'chat-ai': '#f0f4f8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
