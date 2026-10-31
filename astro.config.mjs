import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

function gitSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; }
}

export default defineConfig({
  site: 'https://www.polesineparmense36.it',
  output: 'static',
  adapter: vercel(),
  integrations: [mdx(), tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(`v${pkg.version} · ${gitSha()}`),
    },
  },
  security: {
    checkOrigin: false,
  },
});
