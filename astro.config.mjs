import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.polesineparmense36.it',
  output: 'static',
  adapter: vercel(),
  integrations: [mdx(), tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
  },
  security: {
    checkOrigin: false,
  },
});
