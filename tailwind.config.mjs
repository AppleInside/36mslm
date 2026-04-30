/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        pioppo: '#A8B89B',
        argento: '#C9D4BD',
        po: '#9BAFB5',
        acqua: '#C5D3D7',
        sabbia: '#F2EDE0',
        testo: '#2C3530',
      },
      fontFamily: {
        hand: ['Caveat', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
