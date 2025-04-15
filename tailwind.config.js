/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html'],
  theme: {
    extend: {
      colors: {
        'service-pink': '#FFF1F3',
        'command-blue': '#EFF6FF',
        'query-green': '#ECFDF5',
        'event-yellow': '#FFFBEB',
        'channel-gray': '#F9FAFB',
      },
    },
  },
  plugins: [],
};
