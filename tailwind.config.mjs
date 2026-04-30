/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        paper:    '#F4EBD9',
        'paper-2':'#EFE3CB',
        ink:      '#1F2A2A',
        'ink-soft':'#3A4747',
        gold:     '#D8A14A',
        'gold-deep':'#B5802A',
        alga:     '#7B8F6F',
        acquadeep:'#4A6670',
        brand:    '#0F71B8',
        'brand-deep':'#0A578F',
        rule:     'rgba(31,42,42,0.18)',

        pioppo: '#A8B89B',
        argento: '#C9D4BD',
        po: '#9BAFB5',
        acqua: '#C5D3D7',
        sabbia: '#F2EDE0',
        testo: '#2C3530',
      },
      fontFamily: {
        hand: ['Caveat', 'cursive'],
        serif: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
