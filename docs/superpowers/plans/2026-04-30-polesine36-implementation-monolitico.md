# Polesine Parmense 36 m s.l.m. — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire il nuovo sito dell'APS "36 m s.l.m." come strumento operativo di promozione territoriale (eventi, territorio, ricettario, storie, partecipazione), con bilinguismo IT/EN, watermark foto e admin minimale.

**Architecture:** Astro + TypeScript + Tailwind con MDX per contenuti statici (eventi, ricette, itinerari, storie, bacheca, places). Postgres su Replit (Neon) via Drizzle per dati runtime (form submissions, foto metadata, press requests). Resend per email. Replit Object Storage + sharp.js per pipeline foto (originale privato, web watermarkato pubblico). Leaflet+OSM per mappe. Magic-link auth solo per `/admin/*`.

**Tech Stack:** Astro 4, TypeScript, Tailwind CSS, MDX content collections, Drizzle ORM + Postgres, Resend, Replit Object Storage, sharp.js, Leaflet, Vitest (lib/API), Playwright (smoke E2E opzionale).

**Linee guida trasversali:**
- TDD rigoroso per logica isolata (lib utils, API handlers, watermark pipeline, slugify, frontmatter parsing). Per pagine/UI: build + smoke check manuale.
- Ogni task termina con un commit. Messaggi: Conventional Commits (`feat:`, `chore:`, `fix:`, `test:`, `docs:`).
- Non aggiungere feature non listate nello spec (`docs/superpowers/specs/2026-04-30-polesine36-redesign-design.md`).
- I contenuti reali del vecchio sito vengono importati nelle Task 33-35; tutto ciò che precede usa fixture minime.

---

## File Structure

```
.
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── drizzle.config.ts
├── .env.example
├── public/
│   ├── favicon.svg
│   └── fonts/                      # self-host fallback se serve
├── src/
│   ├── env.d.ts
│   ├── consts.ts                   # costanti site (titolo, url, email admin)
│   ├── i18n/
│   │   ├── ui.ts                   # traduzioni UI IT/EN
│   │   └── utils.ts                # helpers getLangFromUrl, useTranslations
│   ├── content/
│   │   ├── config.ts               # schemas zod content collections
│   │   ├── events/{it,en}/
│   │   ├── recipes/{it,en}/
│   │   ├── itineraries/{it,en}/
│   │   ├── stories/{it,en}/
│   │   ├── notices/{it,en}/
│   │   └── places/{it,en}/
│   ├── layouts/
│   │   ├── Base.astro              # html, head, header, footer
│   │   └── Article.astro           # layout per MDX (recipe, story, event, …)
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LangSwitcher.astro
│   │   ├── EventCard.astro
│   │   ├── PlaceCard.astro
│   │   ├── RecipeCard.astro
│   │   ├── StoryCard.astro
│   │   ├── NoticeRow.astro
│   │   ├── HeroEvent.astro
│   │   ├── Map.astro               # island Leaflet
│   │   ├── PressGalleryItem.astro
│   │   └── forms/
│   │       ├── EventSignupForm.astro
│   │       ├── TesseraForm.astro
│   │       ├── VolunteerForm.astro
│   │       ├── ReportForm.astro
│   │       ├── PressRequestForm.astro
│   │       └── ContactForm.astro
│   ├── lib/
│   │   ├── slug.ts
│   │   ├── dates.ts                # formatDate per locale
│   │   ├── env.ts                  # validazione env vars
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── schema.ts           # tabelle drizzle
│   │   ├── email/
│   │   │   ├── resend.ts
│   │   │   └── templates.ts
│   │   ├── photos/
│   │   │   ├── watermark.ts        # sharp pipeline
│   │   │   ├── exif.ts
│   │   │   └── storage.ts          # wrapper Replit Object Storage
│   │   ├── auth/
│   │   │   ├── magicLink.ts
│   │   │   └── session.ts
│   │   └── forms/
│   │       └── validators.ts       # zod schemas form
│   ├── pages/
│   │   ├── index.astro             # redirect /it/
│   │   ├── [lang]/
│   │   │   ├── index.astro
│   │   │   ├── eventi/
│   │   │   │   ├── index.astro
│   │   │   │   └── [slug].astro
│   │   │   ├── scopri/
│   │   │   │   ├── index.astro
│   │   │   │   ├── territorio/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   ├── itinerari/{index,[slug]}.astro
│   │   │   │   │   └── places/{index,[slug]}.astro
│   │   │   │   ├── ricettario/{index,[slug]}.astro
│   │   │   │   └── storie/{index,[slug]}.astro
│   │   │   ├── partecipa/
│   │   │   │   ├── index.astro
│   │   │   │   ├── tessera.astro
│   │   │   │   ├── 5x1000.astro
│   │   │   │   ├── volontari.astro
│   │   │   │   ├── bacheca/{index,[slug]}.astro
│   │   │   │   └── segnalazioni.astro
│   │   │   ├── chi-siamo/
│   │   │   │   ├── index.astro
│   │   │   │   ├── storia.astro
│   │   │   │   ├── statuto.astro
│   │   │   │   ├── trasparenza.astro
│   │   │   │   └── press-kit.astro
│   │   │   └── contatti.astro
│   │   ├── api/
│   │   │   ├── event-signup.ts
│   │   │   ├── tessera.ts
│   │   │   ├── volunteer.ts
│   │   │   ├── report.ts
│   │   │   ├── contact.ts
│   │   │   ├── press-request.ts
│   │   │   ├── press-download/[token].ts
│   │   │   ├── upload-photo.ts
│   │   │   └── auth/
│   │   │       ├── request.ts
│   │   │       └── verify.ts
│   │   └── admin/
│   │       ├── index.astro
│   │       ├── login.astro
│   │       ├── photos.astro
│   │       └── press-requests.astro
│   └── styles/
│       └── global.css
├── tests/
│   ├── unit/                        # vitest
│   │   ├── slug.test.ts
│   │   ├── dates.test.ts
│   │   ├── validators.test.ts
│   │   ├── watermark.test.ts
│   │   ├── exif.test.ts
│   │   ├── magicLink.test.ts
│   │   └── i18n.test.ts
│   └── api/
│       ├── event-signup.test.ts
│       ├── press-request.test.ts
│       └── upload-photo.test.ts
├── scripts/
│   ├── scrape-legacy.ts
│   ├── inventory.ts
│   ├── convert-to-mdx.ts
│   └── process-photos.ts
└── legacy/                          # output scraper (gitignored a parte inventory.json)
    ├── pages/
    ├── images/
    └── inventory.json
```

---

## Task 1: Bootstrap del progetto Astro + TypeScript

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`, `README.md`

- [ ] **Step 1: Init Astro con template minimal**

```bash
npm create astro@latest -- . --template minimal --typescript strict --install --no-git --skip-houston
```

- [ ] **Step 2: Installare dipendenze base**

```bash
npm install @astrojs/mdx @astrojs/tailwind @astrojs/sitemap @astrojs/node
npm install -D tailwindcss vitest @types/node
```

- [ ] **Step 3: Configurare `astro.config.mjs` con SSR ibrido**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.polesineparmense36.it',
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), tailwind({ applyBaseStyles: false }), sitemap()],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
    fallback: { en: 'it' },
  },
});
```

- [ ] **Step 4: Aggiornare `.gitignore`**

```
node_modules
dist
.astro
.env
.env.local
legacy/pages
legacy/images
*.log
```

- [ ] **Step 5: Creare `.env.example`**

```
DATABASE_URL=
RESEND_API_KEY=
ADMIN_EMAIL=alessandro.nicoli@mindmash.it
SESSION_SECRET=
OBJECT_STORAGE_BUCKET_ORIGINAL=photos-original
OBJECT_STORAGE_BUCKET_WEB=photos-web
OBJECT_STORAGE_PUBLIC_URL=
SITE_URL=http://localhost:4321
```

- [ ] **Step 6: Verificare build vuota**

Run: `npm run build`
Expected: build completa senza errori (anche se nessuna pagina utile esiste).

- [ ] **Step 7: Init git e primo commit**

```bash
git init
git add -A
git commit -m "chore: bootstrap astro + ts + tailwind + mdx"
```

---

## Task 2: Tailwind con palette "Pioppi & fiume" e font

**Files:**
- Create: `tailwind.config.mjs`, `src/styles/global.css`
- Modify: `src/pages/index.astro` (sostituirà placeholder)

- [ ] **Step 1: Scrivere `tailwind.config.mjs` con tokens**

```js
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
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Creare `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { color-scheme: light; }
  html { background: theme('colors.sabbia'); color: theme('colors.testo'); }
  body { @apply font-sans antialiased; }
  h1, h2, h3 { @apply font-hand; line-height: 1.05; }
  a { @apply underline decoration-pioppo decoration-2 underline-offset-4; }
  a:hover { @apply text-pioppo; }
}
```

- [ ] **Step 3: Smoke index page**

Sostituire `src/pages/index.astro` con redirect a `/it/` (lo finiremo in Task 5):

```astro
---
return Astro.redirect('/it/');
---
```

- [ ] **Step 4: Build verifica**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: tailwind palette pioppi & fiume + font caveat/inter"
```

---

## Task 3: Vitest setup + lib/slug.ts (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/lib/slug.ts`, `tests/unit/slug.test.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Aggiungere script test in `package.json`**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Creare `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 3: Test fallente per `slug`**

`tests/unit/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/lib/slug';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Camminata in Golena')).toBe('camminata-in-golena');
  });
  it('strips italian accents', () => {
    expect(slugify('Città è perché')).toBe('citta-e-perche');
  });
  it('removes punctuation', () => {
    expect(slugify('Risotto, è pronto!')).toBe('risotto-e-pronto');
  });
  it('collapses repeated hyphens', () => {
    expect(slugify('a -- b')).toBe('a-b');
  });
});
```

- [ ] **Step 4: Run test → fail**

Run: `npm test`
Expected: FAIL (slug non esiste).

- [ ] **Step 5: Implementare `src/lib/slug.ts`**

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 6: Run test → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(lib): add slugify utility with tests"
```

---

## Task 4: i18n core — UI strings + helpers (TDD)

**Files:**
- Create: `src/i18n/ui.ts`, `src/i18n/utils.ts`, `tests/unit/i18n.test.ts`

- [ ] **Step 1: Test fallente**

`tests/unit/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations } from '../../src/i18n/utils';

describe('i18n', () => {
  it('extracts lang from URL path', () => {
    expect(getLangFromUrl(new URL('https://x/it/eventi'))).toBe('it');
    expect(getLangFromUrl(new URL('https://x/en/events'))).toBe('en');
    expect(getLangFromUrl(new URL('https://x/'))).toBe('it');
  });
  it('translates known keys', () => {
    const t = useTranslations('it');
    expect(t('nav.events')).toBe('Eventi');
    const tEn = useTranslations('en');
    expect(tEn('nav.events')).toBe('Events');
  });
  it('falls back to italian when key missing in en', () => {
    const t = useTranslations('en');
    expect(t('common.contactUs')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implementare `src/i18n/ui.ts`**

```ts
export const languages = { it: 'Italiano', en: 'English' } as const;
export const defaultLang = 'it' as const;
export type Lang = keyof typeof languages;

export const ui = {
  it: {
    'nav.events': 'Eventi',
    'nav.discover': 'Scopri',
    'nav.participate': 'Partecipa',
    'nav.about': 'Chi siamo',
    'nav.contact': 'Contatti',
    'nav.discover.territory': 'Territorio',
    'nav.discover.recipes': 'Ricettario',
    'nav.discover.stories': 'Storie & memoria',
    'nav.participate.membership': 'Tessera',
    'nav.participate.5x1000': '5×1000',
    'nav.participate.volunteers': 'Volontari',
    'nav.participate.notices': 'Bacheca',
    'nav.participate.reports': 'Segnalazioni',
    'nav.about.history': 'Storia',
    'nav.about.statute': 'Statuto',
    'nav.about.transparency': 'Trasparenza',
    'nav.about.press': 'Press kit',
    'home.heroCta.signup': 'Iscriviti',
    'home.heroCta.allEvents': 'Tutti gli eventi',
    'common.next': 'Prossimo',
    'common.allEvents': 'Tutti gli eventi',
    'common.subscribe': 'Iscriviti',
    'common.send': 'Invia',
    'common.contactUs': 'Contattaci',
    'common.requiredFields': 'Campi obbligatori',
    'common.thanks': 'Grazie!',
    'press.requestHires': 'Richiedi alta risoluzione',
    'footer.codiceFiscale': 'Codice fiscale',
    'footer.headquarters': 'Sede',
    'footer.press': 'Sei della stampa? → Press kit',
  },
  en: {
    'nav.events': 'Events',
    'nav.discover': 'Discover',
    'nav.participate': 'Participate',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.discover.territory': 'Territory',
    'nav.discover.recipes': 'Recipes',
    'nav.discover.stories': 'Stories & memory',
    'nav.participate.membership': 'Membership',
    'nav.participate.5x1000': '5×1000',
    'nav.participate.volunteers': 'Volunteers',
    'nav.participate.notices': 'Noticeboard',
    'nav.participate.reports': 'Submissions',
    'nav.about.history': 'History',
    'nav.about.statute': 'Bylaws',
    'nav.about.transparency': 'Transparency',
    'nav.about.press': 'Press kit',
    'home.heroCta.signup': 'Sign up',
    'home.heroCta.allEvents': 'All events',
    'common.next': 'Next',
    'common.allEvents': 'All events',
    'common.subscribe': 'Sign up',
    'common.send': 'Send',
    'common.requiredFields': 'Required fields',
    'common.thanks': 'Thank you!',
    'press.requestHires': 'Request hi-res',
    'footer.headquarters': 'Office',
  },
} as const;

export type UiKey = keyof typeof ui['it'];
```

- [ ] **Step 3: Implementare `src/i18n/utils.ts`**

```ts
import { ui, defaultLang, type Lang, type UiKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split('/');
  if (seg === 'it' || seg === 'en') return seg;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    const dict = ui[lang] as Record<string, string>;
    return dict[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key;
  };
}

export function localizedPath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `/${lang}/${clean}`;
}
```

- [ ] **Step 4: Run test → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(i18n): UI strings IT/EN + lang helpers"
```

---

## Task 5: Layout base, Header, Footer, LangSwitcher

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/LangSwitcher.astro`, `src/consts.ts`

- [ ] **Step 1: `src/consts.ts`**

```ts
export const SITE = {
  name: '36 m s.l.m.',
  longName: 'Associazione di Promozione Sociale 36 m s.l.m.',
  url: import.meta.env.SITE_URL ?? 'https://www.polesineparmense36.it',
  email: 'info@polesineparmense36.it',
  codiceFiscale: '00000000000',
  address: 'Polesine Parmense (PR), Italia',
};
```

- [ ] **Step 2: `src/components/LangSwitcher.astro`**

```astro
---
import { getLangFromUrl } from '../i18n/utils';
const current = getLangFromUrl(Astro.url);
const other = current === 'it' ? 'en' : 'it';
const path = Astro.url.pathname.replace(/^\/(it|en)/, `/${other}`) || `/${other}/`;
---
<a href={path} class="text-sm uppercase tracking-wide no-underline hover:text-pioppo" aria-label={`Switch to ${other}`}>
  {other}
</a>
```

- [ ] **Step 3: `src/components/Header.astro`**

```astro
---
import { getLangFromUrl, useTranslations, localizedPath } from '../i18n/utils';
import LangSwitcher from './LangSwitcher.astro';
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const nav = [
  { href: localizedPath(lang, 'eventi'), label: t('nav.events') },
  { href: localizedPath(lang, 'scopri'), label: t('nav.discover') },
  { href: localizedPath(lang, 'partecipa'), label: t('nav.participate') },
  { href: localizedPath(lang, 'chi-siamo'), label: t('nav.about') },
  { href: localizedPath(lang, 'contatti'), label: t('nav.contact') },
];
---
<header class="border-b border-argento/60 bg-sabbia">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
    <a href={localizedPath(lang, '')} class="font-hand text-2xl no-underline">36 m s.l.m.</a>
    <nav class="hidden gap-6 md:flex">
      {nav.map((n) => <a href={n.href} class="no-underline hover:text-pioppo">{n.label}</a>)}
    </nav>
    <LangSwitcher />
  </div>
</header>
```

- [ ] **Step 4: `src/components/Footer.astro`**

```astro
---
import { SITE } from '../consts';
import { getLangFromUrl, useTranslations, localizedPath } from '../i18n/utils';
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---
<footer class="mt-20 border-t border-argento/60 bg-sabbia">
  <div class="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
    <div>
      <p class="font-hand text-xl">{SITE.name}</p>
      <p class="opacity-80">{SITE.longName}</p>
      <p class="opacity-80">{SITE.address}</p>
      <p class="opacity-80">CF {SITE.codiceFiscale}</p>
    </div>
    <div>
      <p class="font-semibold">{t('nav.contact')}</p>
      <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
    </div>
    <div>
      <p><a href={localizedPath(lang, 'chi-siamo/press-kit')}>{t('footer.press')}</a></p>
      <p><a href={localizedPath(lang, 'chi-siamo/statuto')}>{t('nav.about.statute')}</a></p>
      <p><a href={localizedPath(lang, 'chi-siamo/trasparenza')}>{t('nav.about.transparency')}</a></p>
    </div>
  </div>
</footer>
```

- [ ] **Step 5: `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { SITE } from '../consts';
import { getLangFromUrl } from '../i18n/utils';
const lang = getLangFromUrl(Astro.url);
const { title, description } = Astro.props as { title: string; description?: string };
---
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title} · {SITE.name}</title>
    {description && <meta name="description" content={description} />}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Inter:wght@400;500;600&display=swap" />
  </head>
  <body class="min-h-screen flex flex-col">
    <Header />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-10"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Build verifica**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): base layout, header, footer, lang switcher"
```

---

## Task 6: Content collections schemas + fixture iniziali

**Files:**
- Create: `src/content/config.ts`, fixture: `src/content/events/it/2026-05-10-camminata-golena.mdx`, `src/content/events/it/2026-06-15-festa-strolghino.mdx`, `src/content/recipes/it/risotto-zucca.mdx`, `src/content/itineraries/it/anello-golena.mdx`, `src/content/stories/it/dialetto-pioppi.mdx`, `src/content/notices/it/2026-04-15-assemblea.mdx`, `src/content/places/it/trattoria-al-cavallino.mdx`

- [ ] **Step 1: Schemas `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const baseFrontmatter = {
  title: z.string(),
  date: z.coerce.date(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const events = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    location: z.string(),
    coords: z.tuple([z.number(), z.number()]).optional(),
    endsAt: z.coerce.date().optional(),
    signupClosesAt: z.coerce.date().optional(),
    signupRequired: z.boolean().default(true),
  }),
});

const recipes = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    seasons: z.array(z.enum(['primavera', 'estate', 'autunno', 'inverno'])).default([]),
    course: z.enum(['antipasto', 'primo', 'secondo', 'contorno', 'dolce']),
    dialectName: z.string().optional(),
  }),
});

const itineraries = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    distanceKm: z.number(),
    durationMin: z.number(),
    difficulty: z.enum(['facile', 'medio', 'impegnativo']),
    gpx: z.string().optional(),
    pdf: z.string().optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  }),
});

const stories = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    author: z.string().optional(),
    excerpt: z.string().optional(),
  }),
});

const notices = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    attachments: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  }),
});

const places = defineCollection({
  type: 'content',
  schema: z.object({
    ...baseFrontmatter,
    kind: z.enum(['ristorante', 'agriturismo', 'b&b', 'azienda', 'altro']),
    address: z.string(),
    coords: z.tuple([z.number(), z.number()]).optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
  }),
});

export const collections = { events, recipes, itineraries, stories, notices, places };
```

- [ ] **Step 2: Fixture eventi**

`src/content/events/it/2026-05-10-camminata-golena.mdx`:

```mdx
---
title: "Camminata in golena al risveglio del Po"
date: 2026-05-10T06:30:00+02:00
location: "Argine maestro, Polesine Parmense"
coords: [44.9356, 10.1247]
signupRequired: true
tags: ["natura", "alba"]
---

Sei chilometri tra pioppi e meandri, accompagnati dai volontari dell'associazione.
Ritrovo all'argine alle 6:30. Adatto a tutti, scarpe comode.
```

`src/content/events/it/2026-06-15-festa-strolghino.mdx`:

```mdx
---
title: "Festa dello strolghino"
date: 2026-06-15T19:00:00+02:00
location: "Piazza Garibaldi, Polesine Parmense"
coords: [44.9352, 10.1240]
signupRequired: false
tags: ["gastronomia", "tradizione"]
---

Serata di degustazione e musica popolare. Banchetti dei produttori locali.
```

- [ ] **Step 3: Una fixture per ogni collection**

`src/content/recipes/it/risotto-zucca.mdx`:

```mdx
---
title: "Risotto alla zucca di Polesine"
date: 2026-04-30
seasons: ["autunno", "inverno"]
course: "primo"
dialectName: "Risòt ad süca"
tags: ["riso", "zucca"]
---

Ingredienti per 4: 320g riso carnaroli, 400g zucca, brodo, parmigiano, scalogno.
Procedimento: soffritto, riso tostato, zucca a tocchetti, brodo, mantecatura.
```

`src/content/itineraries/it/anello-golena.mdx`:

```mdx
---
title: "Anello della golena"
date: 2026-04-30
distanceKm: 6.2
durationMin: 90
difficulty: "facile"
tags: ["fiume", "pioppi"]
---

Percorso ad anello dall'argine fino alla lanca e ritorno.
```

`src/content/stories/it/dialetto-pioppi.mdx`:

```mdx
---
title: "I nomi dei pioppi nel dialetto di Polesine"
date: 2026-04-30
author: "Anna B."
excerpt: "Dal pioppo cipressino al pioppo nero: come li chiamavano i nostri nonni."
tags: ["dialetto", "natura"]
---

Storie raccolte tra le case del paese.
```

`src/content/notices/it/2026-04-15-assemblea.mdx`:

```mdx
---
title: "Convocazione assemblea ordinaria 2026"
date: 2026-04-15
tags: ["assemblea"]
---

L'assemblea ordinaria è convocata per il 15 maggio 2026 alle 21:00.
```

`src/content/places/it/trattoria-al-cavallino.mdx`:

```mdx
---
title: "Trattoria Al Cavallino"
date: 2026-04-30
kind: "ristorante"
address: "Via Roma 12, Polesine Parmense"
coords: [44.9351, 10.1245]
phone: "+39 0524 000000"
tags: ["culatello", "tradizione"]
---

Cucina tradizionale del Po: culatello, anolini in brodo, spalla cotta.
```

- [ ] **Step 4: Build verifica schema**

Run: `npm run build`
Expected: build OK, content collections validate.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(content): collections schemas + initial fixtures"
```

---

## Task 7: Pagina root e index per lingua

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/[lang]/index.astro`, `src/components/HeroEvent.astro`, `src/components/EventCard.astro`, `src/lib/dates.ts`

- [ ] **Step 1: Test fallente per dates**

`tests/unit/dates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatEventDate } from '../../src/lib/dates';

describe('formatEventDate', () => {
  it('formats italian date', () => {
    const out = formatEventDate(new Date('2026-05-10T06:30:00+02:00'), 'it');
    expect(out).toMatch(/10 maggio 2026/);
  });
  it('formats english date', () => {
    const out = formatEventDate(new Date('2026-05-10T06:30:00+02:00'), 'en');
    expect(out).toMatch(/May 10, 2026/);
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implementare `src/lib/dates.ts`**

```ts
import type { Lang } from '../i18n/ui';
const LOCALES: Record<Lang, string> = { it: 'it-IT', en: 'en-US' };

export function formatEventDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}
export function formatTime(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { hour: '2-digit', minute: '2-digit' }).format(date);
}
```

- [ ] **Step 4: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: `src/components/EventCard.astro`**

```astro
---
import { formatEventDate } from '../lib/dates';
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `eventi/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  <p class="mt-1 text-sm opacity-80">{entry.data.location}</p>
</a>
```

- [ ] **Step 6: `src/components/HeroEvent.astro`**

```astro
---
import { formatEventDate, formatTime } from '../lib/dates';
import { getLangFromUrl, useTranslations, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<section class="rounded-3xl bg-gradient-to-b from-sabbia to-argento/60 p-8 md:p-12">
  <p class="text-xs uppercase tracking-wider text-po">{t('common.next')} · {formatEventDate(entry.data.date, lang)} · {formatTime(entry.data.date, lang)}</p>
  <h1 class="mt-2 text-5xl md:text-6xl">{entry.data.title}</h1>
  <p class="mt-3 max-w-prose opacity-80">{entry.data.location}</p>
  <div class="mt-6 flex gap-3">
    {entry.data.signupRequired && (
      <a href={localizedPath(lang, `eventi/${slug}#iscrivimi`)} class="rounded-full bg-pioppo px-5 py-2 text-white no-underline">{t('home.heroCta.signup')}</a>
    )}
    <a href={localizedPath(lang, 'eventi')} class="rounded-full border border-pioppo px-5 py-2 no-underline">{t('home.heroCta.allEvents')}</a>
  </div>
</section>
```

- [ ] **Step 7: `src/pages/[lang]/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import HeroEvent from '../../components/HeroEvent.astro';
import EventCard from '../../components/EventCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations, localizedPath } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const now = new Date();
const all = await getCollection('events', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft && e.data.date >= now);
all.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
const [next, ...rest] = all;
const upcoming = rest.slice(0, 3);
---
<Base title={t('nav.events')}>
  {next && <HeroEvent entry={next} />}
  <section class="mt-12">
    <h2 class="text-3xl">{t('common.allEvents')}</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-3">{upcoming.map((e) => <EventCard entry={e} />)}</div>
  </section>
  <section class="mt-12 grid gap-4 md:grid-cols-3">
    <a href={localizedPath(lang, 'scopri/territorio')} class="rounded-2xl bg-acqua/40 p-6 no-underline">
      <h3 class="text-2xl">{t('nav.discover.territory')}</h3>
    </a>
    <a href={localizedPath(lang, 'scopri/ricettario')} class="rounded-2xl bg-argento/50 p-6 no-underline">
      <h3 class="text-2xl">{t('nav.discover.recipes')}</h3>
    </a>
    <a href={localizedPath(lang, 'scopri/storie')} class="rounded-2xl bg-pioppo/30 p-6 no-underline">
      <h3 class="text-2xl">{t('nav.discover.stories')}</h3>
    </a>
  </section>
  <section class="mt-12 grid gap-4 md:grid-cols-2">
    <a href={localizedPath(lang, 'partecipa/tessera')} class="rounded-2xl border border-pioppo p-6 no-underline">
      <h3 class="text-2xl">{t('nav.participate.membership')}</h3>
    </a>
    <a href={localizedPath(lang, 'partecipa/volontari')} class="rounded-2xl border border-po p-6 no-underline">
      <h3 class="text-2xl">{t('nav.participate.volunteers')}</h3>
    </a>
  </section>
</Base>
```

- [ ] **Step 8: Build + smoke**

Run: `npm run build && npm run preview`
Expected: `/it/` mostra hero + cards.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): hero next event + upcoming + section grid"
```

---

## Task 8: Lista e dettaglio eventi

**Files:**
- Create: `src/pages/[lang]/eventi/index.astro`, `src/pages/[lang]/eventi/[slug].astro`, `src/layouts/Article.astro`

- [ ] **Step 1: `src/layouts/Article.astro`**

```astro
---
import Base from './Base.astro';
const { title, description, date, lang } = Astro.props;
import { formatEventDate } from '../lib/dates';
---
<Base title={title} description={description}>
  <article class="mx-auto max-w-prose">
    {date && <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(new Date(date), lang)}</p>}
    <h1 class="mt-2 text-5xl">{title}</h1>
    <div class="prose mt-6"><slot /></div>
  </article>
</Base>
```

- [ ] **Step 2: `src/pages/[lang]/eventi/index.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import EventCard from '../../../components/EventCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const events = await getCollection('events', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
events.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
---
<Base title={t('nav.events')}>
  <h1 class="text-5xl">{t('nav.events')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{events.map((e) => <EventCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: `src/pages/[lang]/eventi/[slug].astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import EventSignupForm from '../../../components/forms/EventSignupForm.astro';
import { getCollection } from 'astro:content';
import { formatEventDate, formatTime } from '../../../lib/dates';
import type { Lang } from '../../../i18n/ui';

export async function getStaticPaths() {
  const all = await getCollection('events');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title} description={entry.data.location}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)} · {formatTime(entry.data.date, lang)}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <p class="mt-2 opacity-80">{entry.data.location}</p>
    <div class="prose mt-6"><Content /></div>
    {entry.data.signupRequired && (
      <section id="iscrivimi" class="mt-10">
        <EventSignupForm eventSlug={entry.slug} />
      </section>
    )}
  </article>
</Base>
```

- [ ] **Step 4: Stub form (la implementazione completa è in Task 12)**

`src/components/forms/EventSignupForm.astro`:

```astro
---
const { eventSlug } = Astro.props;
---
<form method="POST" action="/api/event-signup" class="grid gap-3 rounded-2xl border border-argento p-6">
  <input type="hidden" name="eventSlug" value={eventSlug} />
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Persone <input type="number" name="people" min="1" max="10" value="1" required class="block w-24 rounded border px-3 py-2" /></label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Iscrivimi</button>
</form>
```

- [ ] **Step 5: Build verifica**

Run: `npm run build`
Expected: build OK con pagine `/it/eventi`, `/it/eventi/<slug>`, `/en/...` (fallback IT).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(events): list page + detail page + signup stub"
```

---

## Task 9: Pagine "Scopri" — territorio (places + itineraries) e ricettario e storie

**Files:**
- Create: `src/pages/[lang]/scopri/index.astro`, `src/pages/[lang]/scopri/territorio/index.astro`, `src/pages/[lang]/scopri/territorio/itinerari/index.astro`, `src/pages/[lang]/scopri/territorio/itinerari/[slug].astro`, `src/pages/[lang]/scopri/territorio/places/index.astro`, `src/pages/[lang]/scopri/territorio/places/[slug].astro`, `src/pages/[lang]/scopri/ricettario/index.astro`, `src/pages/[lang]/scopri/ricettario/[slug].astro`, `src/pages/[lang]/scopri/storie/index.astro`, `src/pages/[lang]/scopri/storie/[slug].astro`, `src/components/PlaceCard.astro`, `src/components/RecipeCard.astro`, `src/components/StoryCard.astro`

- [ ] **Step 1: Card components (3 file)**

`src/components/PlaceCard.astro`:

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/territorio/places/${slug}`)} class="block rounded-2xl border border-argento p-5 no-underline hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{entry.data.kind}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  <p class="mt-1 text-sm opacity-80">{entry.data.address}</p>
</a>
```

`src/components/RecipeCard.astro`:

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/ricettario/${slug}`)} class="block rounded-2xl border border-argento p-5 no-underline hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{entry.data.course}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  {entry.data.dialectName && <p class="mt-1 font-hand text-xl">{entry.data.dialectName}</p>}
</a>
```

`src/components/StoryCard.astro`:

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/storie/${slug}`)} class="block rounded-2xl border border-argento p-5 no-underline hover:bg-argento/40">
  <h3 class="text-2xl">{entry.data.title}</h3>
  {entry.data.excerpt && <p class="mt-2 text-sm opacity-80">{entry.data.excerpt}</p>}
</a>
```

- [ ] **Step 2: Index `/scopri`**

`src/pages/[lang]/scopri/index.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const cards = [
  { href: localizedPath(lang, 'scopri/territorio'), label: t('nav.discover.territory') },
  { href: localizedPath(lang, 'scopri/ricettario'), label: t('nav.discover.recipes') },
  { href: localizedPath(lang, 'scopri/storie'), label: t('nav.discover.stories') },
];
---
<Base title={t('nav.discover')}>
  <h1 class="text-5xl">{t('nav.discover')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-3">
    {cards.map((c) => <a href={c.href} class="rounded-2xl bg-argento/40 p-6 no-underline"><h2 class="text-3xl">{c.label}</h2></a>)}
  </div>
</Base>
```

- [ ] **Step 3: `/scopri/territorio` index, `itinerari/{index,[slug]}`, `places/{index,[slug]}`**

`src/pages/[lang]/scopri/territorio/index.astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../../i18n/utils';
import type { Lang } from '../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
---
<Base title={t('nav.discover.territory')}>
  <h1 class="text-5xl">{t('nav.discover.territory')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">
    <a href={localizedPath(lang, 'scopri/territorio/itinerari')} class="rounded-2xl bg-acqua/40 p-6 no-underline"><h2 class="text-3xl">Itinerari</h2></a>
    <a href={localizedPath(lang, 'scopri/territorio/places')} class="rounded-2xl bg-argento/50 p-6 no-underline"><h2 class="text-3xl">Mangiare & dormire</h2></a>
  </div>
</Base>
```

`src/pages/[lang]/scopri/territorio/itinerari/index.astro`:

```astro
---
import Base from '../../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import { localizedPath } from '../../../../../i18n/utils';
import type { Lang } from '../../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const items = await getCollection('itineraries', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
---
<Base title="Itinerari">
  <h1 class="text-5xl">Itinerari</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">
    {items.map((i) => {
      const slug = i.slug.replace(/^(it|en)\//, '');
      return (
        <a href={localizedPath(lang, `scopri/territorio/itinerari/${slug}`)} class="rounded-2xl border border-argento p-5 no-underline">
          <h3 class="text-2xl">{i.data.title}</h3>
          <p class="mt-1 text-sm opacity-80">{i.data.distanceKm} km · {i.data.durationMin} min · {i.data.difficulty}</p>
        </a>
      );
    })}
  </div>
</Base>
```

`src/pages/[lang]/scopri/territorio/itinerari/[slug].astro`:

```astro
---
import Base from '../../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../../i18n/ui';
export async function getStaticPaths() {
  const all = await getCollection('itineraries');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{entry.data.title}</h1>
    <p class="mt-2 opacity-80">{entry.data.distanceKm} km · {entry.data.durationMin} min · {entry.data.difficulty}</p>
    {entry.data.gpx && <p class="mt-2"><a href={entry.data.gpx}>Scarica GPX</a></p>}
    {entry.data.pdf && <p><a href={entry.data.pdf}>Scarica PDF</a></p>}
    <div class="prose mt-6"><Content /></div>
    {/* Mappa: aggiunta in Task 24 */}
  </article>
</Base>
```

`src/pages/[lang]/scopri/territorio/places/index.astro`:

```astro
---
import Base from '../../../../../layouts/Base.astro';
import PlaceCard from '../../../../../components/PlaceCard.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const items = await getCollection('places', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
---
<Base title="Mangiare & dormire">
  <h1 class="text-5xl">Mangiare & dormire</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{items.map((p) => <PlaceCard entry={p} />)}</div>
</Base>
```

`src/pages/[lang]/scopri/territorio/places/[slug].astro`:

```astro
---
import Base from '../../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
export async function getStaticPaths() {
  const all = await getCollection('places');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{entry.data.kind}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <p class="mt-2 opacity-80">{entry.data.address}</p>
    {entry.data.phone && <p>Tel: <a href={`tel:${entry.data.phone}`}>{entry.data.phone}</a></p>}
    {entry.data.website && <p><a href={entry.data.website}>{entry.data.website}</a></p>}
    <div class="prose mt-6"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 4: Ricettario index + slug**

`src/pages/[lang]/scopri/ricettario/index.astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import RecipeCard from '../../../../components/RecipeCard.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const recipes = await getCollection('recipes', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
---
<Base title="Ricettario">
  <h1 class="text-5xl">Ricettario</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-3">{recipes.map((r) => <RecipeCard entry={r} />)}</div>
</Base>
```

`src/pages/[lang]/scopri/ricettario/[slug].astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
export async function getStaticPaths() {
  const all = await getCollection('recipes');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{entry.data.course} · {entry.data.seasons.join(', ')}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    {entry.data.dialectName && <p class="mt-2 font-hand text-3xl">{entry.data.dialectName}</p>}
    <div class="prose mt-6"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 5: Storie index + slug** (analogo a ricettario, usando StoryCard e file `src/pages/[lang]/scopri/storie/index.astro` e `[slug].astro` — stessa struttura)

`src/pages/[lang]/scopri/storie/index.astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import StoryCard from '../../../../components/StoryCard.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const stories = await getCollection('stories', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
stories.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<Base title="Storie & memoria">
  <h1 class="text-5xl">Storie & memoria</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{stories.map((s) => <StoryCard entry={s} />)}</div>
</Base>
```

`src/pages/[lang]/scopri/storie/[slug].astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import { formatEventDate } from '../../../../lib/dates';
import type { Lang } from '../../../../i18n/ui';
export async function getStaticPaths() {
  const all = await getCollection('stories');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}{entry.data.author ? ` · ${entry.data.author}` : ''}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <div class="prose mt-6"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 6: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(scopri): territorio (itinerari, places), ricettario, storie"
```

---

## Task 10: Pagine "Partecipa" e "Chi siamo" e "Contatti"

**Files:**
- Create: `src/pages/[lang]/partecipa/index.astro`, `src/pages/[lang]/partecipa/tessera.astro`, `src/pages/[lang]/partecipa/5x1000.astro`, `src/pages/[lang]/partecipa/volontari.astro`, `src/pages/[lang]/partecipa/segnalazioni.astro`, `src/pages/[lang]/partecipa/bacheca/index.astro`, `src/pages/[lang]/partecipa/bacheca/[slug].astro`, `src/pages/[lang]/chi-siamo/index.astro`, `src/pages/[lang]/chi-siamo/storia.astro`, `src/pages/[lang]/chi-siamo/statuto.astro`, `src/pages/[lang]/chi-siamo/trasparenza.astro`, `src/pages/[lang]/chi-siamo/press-kit.astro`, `src/pages/[lang]/contatti.astro`, `src/components/forms/{Tessera,Volunteer,Report,Contact,PressRequest}Form.astro`, `src/components/NoticeRow.astro`

- [ ] **Step 1: Form stub components**

Per ognuno (`Tessera`, `Volunteer`, `Report`, `Contact`, `PressRequest`) creare componente con `<form method="POST" action="/api/...">` con campi minimi e bottone submit. Stesso pattern di `EventSignupForm`. Esempio `TesseraForm.astro`:

```astro
<form method="POST" action="/api/tessera" class="grid gap-3 rounded-2xl border border-argento p-6">
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Cognome <input name="surname" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Telefono <input name="phone" class="block w-full rounded border px-3 py-2" /></label>
  <label>Nato a <input name="birthplace" class="block w-full rounded border px-3 py-2" /></label>
  <label>Data di nascita <input type="date" name="birthdate" class="block w-full rounded border px-3 py-2" /></label>
  <label>Indirizzo <input name="address" class="block w-full rounded border px-3 py-2" /></label>
  <label class="flex items-start gap-2"><input type="checkbox" name="privacy" required /> Accetto privacy</label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia</button>
</form>
```

`VolunteerForm.astro`:

```astro
<form method="POST" action="/api/volunteer" class="grid gap-3 rounded-2xl border border-argento p-6">
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Telefono <input name="phone" class="block w-full rounded border px-3 py-2" /></label>
  <label>Mi piacerebbe aiutare con
    <select name="area" class="block w-full rounded border px-3 py-2">
      <option value="eventi">Eventi</option>
      <option value="comunicazione">Comunicazione</option>
      <option value="territorio">Cura del territorio</option>
      <option value="archivio">Archivio storico</option>
      <option value="altro">Altro</option>
    </select>
  </label>
  <label>Note <textarea name="notes" rows="4" class="block w-full rounded border px-3 py-2"></textarea></label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia</button>
</form>
```

`ReportForm.astro`:

```astro
<form method="POST" action="/api/report" class="grid gap-3 rounded-2xl border border-argento p-6">
  <label>Tipo
    <select name="kind" required class="block w-full rounded border px-3 py-2">
      <option value="evento">Proporre un evento</option>
      <option value="storia">Segnalare una storia</option>
      <option value="foto">Condividere una foto</option>
      <option value="altro">Altro</option>
    </select>
  </label>
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Messaggio <textarea name="message" rows="6" required class="block w-full rounded border px-3 py-2"></textarea></label>
  <label class="flex items-start gap-2"><input type="checkbox" name="consent" required /> Acconsento all'uso del materiale con attribuzione</label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia</button>
</form>
```

`ContactForm.astro`:

```astro
<form method="POST" action="/api/contact" class="grid gap-3 rounded-2xl border border-argento p-6">
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Messaggio <textarea name="message" rows="6" required class="block w-full rounded border px-3 py-2"></textarea></label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia</button>
</form>
```

`PressRequestForm.astro`:

```astro
---
const { photoIds = [] } = Astro.props;
---
<form method="POST" action="/api/press-request" class="grid gap-3 rounded-2xl border border-argento p-6">
  {photoIds.map((id) => <input type="hidden" name="photoIds" value={id} />)}
  <label>Testata <input name="outlet" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
  <label>Uso previsto <textarea name="purpose" required rows="4" class="block w-full rounded border px-3 py-2"></textarea></label>
  <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Richiedi alta-res</button>
</form>
```

- [ ] **Step 2: `partecipa/index.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const items = [
  ['tessera', 'nav.participate.membership'],
  ['5x1000', 'nav.participate.5x1000'],
  ['volontari', 'nav.participate.volunteers'],
  ['bacheca', 'nav.participate.notices'],
  ['segnalazioni', 'nav.participate.reports'],
];
---
<Base title={t('nav.participate')}>
  <h1 class="text-5xl">{t('nav.participate')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">
    {items.map(([slug, key]) => (
      <a href={localizedPath(lang, `partecipa/${slug}`)} class="rounded-2xl border border-argento p-6 no-underline"><h2 class="text-3xl">{t(key)}</h2></a>
    ))}
  </div>
</Base>
```

- [ ] **Step 3: `tessera.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import TesseraForm from '../../../components/forms/TesseraForm.astro';
---
<Base title="Tessera">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Tessera associativa</h1>
    <div class="prose mt-6">
      <p>La quota associativa è di <strong>15€/anno</strong>. Compila il modulo: ti contatteremo per il pagamento via bonifico o in sede.</p>
      <p>Sostenere l'associazione significa partecipare attivamente alla cura e alla promozione del nostro territorio.</p>
    </div>
    <div class="mt-8"><TesseraForm /></div>
  </article>
</Base>
```

- [ ] **Step 4: `5x1000.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
---
<Base title="5×1000">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">5×1000</h1>
    <div class="prose mt-6">
      <p>Puoi destinare il 5×1000 alla nostra associazione indicando in dichiarazione il codice fiscale:</p>
      <p class="font-hand text-4xl">{SITE.codiceFiscale}</p>
      <p>Firma nel riquadro "Sostegno alle associazioni di promozione sociale".</p>
    </div>
  </article>
</Base>
```

- [ ] **Step 5: `volontari.astro`, `segnalazioni.astro`, `contatti.astro`** (stesso pattern: Base + breve testo + form)

`volontari.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
import VolunteerForm from '../../../components/forms/VolunteerForm.astro';
---
<Base title="Volontari">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Diventa volontario</h1>
    <p class="prose mt-6">Aiutaci a organizzare gli eventi, curare il territorio, mantenere vivo l'archivio. Bastano poche ore.</p>
    <div class="mt-8"><VolunteerForm /></div>
  </article>
</Base>
```

`segnalazioni.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
import ReportForm from '../../../components/forms/ReportForm.astro';
---
<Base title="Segnalazioni">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Segnalazioni</h1>
    <p class="prose mt-6">Proponi un evento, segnala una storia, condividi una foto storica.</p>
    <div class="mt-8"><ReportForm /></div>
  </article>
</Base>
```

`contatti.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
import ContactForm from '../../../components/forms/ContactForm.astro';
import { SITE } from '../../../consts';
---
<Base title="Contatti">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Contatti</h1>
    <p class="prose mt-6">Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
    <p>Sede: {SITE.address}</p>
    <div class="mt-8"><ContactForm /></div>
  </article>
</Base>
```

- [ ] **Step 6: Bacheca index + slug + NoticeRow**

`src/components/NoticeRow.astro`:

```astro
---
import { formatEventDate } from '../lib/dates';
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `partecipa/bacheca/${slug}`)} class="flex items-baseline justify-between border-b border-argento py-3 no-underline">
  <span class="text-lg">{entry.data.title}</span>
  <span class="text-xs text-po">{formatEventDate(entry.data.date, lang)}</span>
</a>
```

`src/pages/[lang]/partecipa/bacheca/index.astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import NoticeRow from '../../../../components/NoticeRow.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const notices = await getCollection('notices', (e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
notices.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<Base title="Bacheca">
  <h1 class="text-5xl">Bacheca</h1>
  <div class="mt-8">{notices.map((n) => <NoticeRow entry={n} />)}</div>
</Base>
```

`src/pages/[lang]/partecipa/bacheca/[slug].astro`:

```astro
---
import Base from '../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import { formatEventDate } from '../../../../lib/dates';
import type { Lang } from '../../../../i18n/ui';
export async function getStaticPaths() {
  const all = await getCollection('notices');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}
const { entry } = Astro.props;
const lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <div class="prose mt-6"><Content /></div>
    {entry.data.attachments.length > 0 && (
      <ul class="mt-6">{entry.data.attachments.map((a) => <li><a href={a.url}>{a.label}</a></li>)}</ul>
    )}
  </article>
</Base>
```

- [ ] **Step 7: `chi-siamo/index.astro`, `storia.astro`, `statuto.astro`, `trasparenza.astro`** (statiche, testo placeholder che owner aggiornerà; nessun form)

`chi-siamo/index.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const items = [
  ['storia', 'nav.about.history'],
  ['statuto', 'nav.about.statute'],
  ['trasparenza', 'nav.about.transparency'],
  ['press-kit', 'nav.about.press'],
];
---
<Base title={t('nav.about')}>
  <h1 class="text-5xl">{t('nav.about')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">
    {items.map(([slug, key]) => (
      <a href={localizedPath(lang, `chi-siamo/${slug}`)} class="rounded-2xl border border-argento p-6 no-underline"><h2 class="text-3xl">{t(key)}</h2></a>
    ))}
  </div>
</Base>
```

`chi-siamo/storia.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
---
<Base title="Storia">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">La nostra storia</h1>
    <div class="prose mt-6">
      <p>L'Associazione di Promozione Sociale "36 m s.l.m." nasce per promuovere il territorio di Polesine Parmense e la cultura del Po.</p>
      <p>Il nome richiama l'altitudine del paese — appena 36 metri sul livello del mare, là dove il fiume si stende e detta i ritmi.</p>
    </div>
  </article>
</Base>
```

`chi-siamo/statuto.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
---
<Base title="Statuto">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Statuto</h1>
    <div class="prose mt-6">
      <p>Lo statuto dell'associazione è disponibile in PDF.</p>
      <p><a href="/docs/statuto.pdf">Scarica lo statuto (PDF)</a></p>
    </div>
  </article>
</Base>
```

`chi-siamo/trasparenza.astro`:

```astro
---
import Base from '../../../layouts/Base.astro';
---
<Base title="Trasparenza">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Trasparenza</h1>
    <div class="prose mt-6">
      <h2>Organi sociali</h2>
      <p>Presidente, Vicepresidente, Tesoriere, Segretario, Consiglio direttivo (nomi aggiornati a cura dell'owner).</p>
      <h2>Bilanci</h2>
      <p>I bilanci consuntivi e preventivi sono pubblicati come allegati PDF.</p>
    </div>
  </article>
</Base>
```

- [ ] **Step 8: `press-kit.astro`** (stub — galleria sarà popolata in Task 23)

```astro
---
import Base from '../../../layouts/Base.astro';
import PressRequestForm from '../../../components/forms/PressRequestForm.astro';
---
<Base title="Press kit">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Press kit</h1>
    <p class="prose mt-6">Foto in anteprima watermarkate. Per richiedere alta risoluzione, compila il modulo specificando testata e uso previsto.</p>
  </article>
  {/* Galleria popolata in Task 23 */}
  <section class="mt-10 mx-auto max-w-prose">
    <PressRequestForm />
  </section>
</Base>
```

- [ ] **Step 9: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(pages): partecipa, chi-siamo, contatti + form components"
```

---

## Task 11: Database Postgres + Drizzle ORM (schema)

**Files:**
- Create: `drizzle.config.ts`, `src/lib/db/client.ts`, `src/lib/db/schema.ts`, `src/lib/env.ts`
- Modify: `package.json`

- [ ] **Step 1: Installare deps**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: Aggiungere script in `package.json`**

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 3: `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 4: `src/lib/env.ts`**

```ts
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'alessandro.nicoli@mindmash.it',
  SESSION_SECRET: process.env.SESSION_SECRET ?? '',
  OBJECT_STORAGE_BUCKET_ORIGINAL: process.env.OBJECT_STORAGE_BUCKET_ORIGINAL ?? 'photos-original',
  OBJECT_STORAGE_BUCKET_WEB: process.env.OBJECT_STORAGE_BUCKET_WEB ?? 'photos-web',
  OBJECT_STORAGE_PUBLIC_URL: process.env.OBJECT_STORAGE_PUBLIC_URL ?? '',
  SITE_URL: process.env.SITE_URL ?? 'http://localhost:4321',
  requireRuntime() {
    required('DATABASE_URL'); required('RESEND_API_KEY'); required('SESSION_SECRET');
  },
};
```

- [ ] **Step 5: `src/lib/db/schema.ts`**

```ts
import { pgTable, text, timestamp, integer, jsonb, uuid, boolean } from 'drizzle-orm/pg-core';

export const eventSignups = pgTable('event_signups', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventSlug: text('event_slug').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  people: integer('people').notNull().default(1),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tesseraRequests = pgTable('tessera_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  birthplace: text('birthplace'),
  birthdate: text('birthdate'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const volunteerRequests = pgTable('volunteer_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  area: text('area').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  consent: boolean('consent').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  caption: text('caption'),
  author: text('author'),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  originalKey: text('original_key').notNull(),
  webKeys: jsonb('web_keys').$type<{ thumb: string; small: string; medium: string; large: string }>().notNull(),
  exif: jsonb('exif').$type<Record<string, unknown>>().default({}).notNull(),
  pressKitVisible: boolean('press_kit_visible').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pressRequests = pgTable('press_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  outlet: text('outlet').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  purpose: text('purpose').notNull(),
  photoIds: jsonb('photo_ids').$type<string[]>().notNull(),
  status: text('status').notNull().default('pending'),
  approvedAt: timestamp('approved_at'),
  downloadToken: text('download_token'),
  downloadExpiresAt: timestamp('download_expires_at'),
  downloadedAt: timestamp('downloaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminMagicLinks = pgTable('admin_magic_links', {
  token: text('token').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
});

export const adminSessions = pgTable('admin_sessions', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

- [ ] **Step 6: `src/lib/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

const queryClient = postgres(env.DATABASE_URL, { max: 5 });
export const db = drizzle(queryClient, { schema });
```

- [ ] **Step 7: Generare migrazione**

Run: `npm run db:generate`
Expected: cartella `drizzle/` con file `.sql`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(db): drizzle schema for forms, photos, press requests, auth"
```

---

## Task 12: Validators zod (TDD) + utility per API handlers

**Files:**
- Create: `src/lib/forms/validators.ts`, `src/lib/forms/respond.ts`, `tests/unit/validators.test.ts`

- [ ] **Step 1: Test fallente**

`tests/unit/validators.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { eventSignupSchema, tesseraSchema, contactSchema, pressRequestSchema } from '../../src/lib/forms/validators';

describe('validators', () => {
  it('accepts valid event signup', () => {
    const r = eventSignupSchema.safeParse({ eventSlug: 'it/x', name: 'A', email: 'a@b.it', people: 2 });
    expect(r.success).toBe(true);
  });
  it('rejects invalid email', () => {
    const r = eventSignupSchema.safeParse({ eventSlug: 'it/x', name: 'A', email: 'nope', people: 1 });
    expect(r.success).toBe(false);
  });
  it('clamps people 1..10', () => {
    expect(eventSignupSchema.safeParse({ eventSlug: 'x', name: 'A', email: 'a@b.it', people: 0 }).success).toBe(false);
    expect(eventSignupSchema.safeParse({ eventSlug: 'x', name: 'A', email: 'a@b.it', people: 11 }).success).toBe(false);
  });
  it('tessera requires privacy', () => {
    const r = tesseraSchema.safeParse({ name: 'A', surname: 'B', email: 'a@b.it', privacy: false });
    expect(r.success).toBe(false);
  });
  it('press request requires non-empty photoIds', () => {
    const r = pressRequestSchema.safeParse({ outlet: 'X', name: 'Y', email: 'a@b.it', purpose: 'Z', photoIds: [] });
    expect(r.success).toBe(false);
  });
  it('contact accepts minimum payload', () => {
    expect(contactSchema.safeParse({ name: 'A', email: 'a@b.it', message: 'Ciao' }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implementare `src/lib/forms/validators.ts`**

```ts
import { z } from 'zod';

export const eventSignupSchema = z.object({
  eventSlug: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  people: z.coerce.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
});
export type EventSignupInput = z.infer<typeof eventSignupSchema>;

export const tesseraSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  birthplace: z.string().optional(),
  birthdate: z.string().optional(),
  address: z.string().optional(),
  privacy: z.coerce.boolean().refine((v) => v === true, 'privacy required'),
});

export const volunteerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  area: z.enum(['eventi', 'comunicazione', 'territorio', 'archivio', 'altro']),
  notes: z.string().max(1000).optional(),
});

export const reportSchema = z.object({
  kind: z.enum(['evento', 'storia', 'foto', 'altro']),
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
  consent: z.coerce.boolean(),
});

export const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
});

export const pressRequestSchema = z.object({
  outlet: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  purpose: z.string().min(1).max(2000),
  photoIds: z.array(z.string().uuid()).min(1),
});
```

- [ ] **Step 4: `src/lib/forms/respond.ts`**

```ts
export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'content-type': 'application/json' } });
}
export function htmlOk(body: string) {
  return new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
export function thanksRedirect(lang: 'it' | 'en'): Response {
  const url = `/${lang}/grazie`;
  return new Response(null, { status: 303, headers: { Location: url } });
}
export async function readForm(request: Request) {
  const fd = await request.formData();
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.endsWith('[]') || out[k] !== undefined) {
      const key = k.replace(/\[\]$/, '');
      const cur = out[key];
      out[key] = Array.isArray(cur) ? [...cur, v] : cur !== undefined ? [cur, v] : [v];
    } else out[k] = v;
  }
  return out;
}
```

- [ ] **Step 5: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(forms): zod validators and response helpers"
```

---

## Task 13: Resend email helper

**Files:**
- Create: `src/lib/email/resend.ts`, `src/lib/email/templates.ts`

- [ ] **Step 1: Install resend**

```bash
npm install resend
```

- [ ] **Step 2: `src/lib/email/resend.ts`**

```ts
import { Resend } from 'resend';
import { env } from '../env';

const client = new Resend(env.RESEND_API_KEY);
const FROM = '36 m s.l.m. <noreply@polesineparmense36.it>';

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing — skipping send', opts.subject);
    return;
  }
  await client.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
}
```

- [ ] **Step 3: `src/lib/email/templates.ts`**

```ts
const wrap = (inner: string) =>
  `<div style="font-family:Inter,system-ui,sans-serif;color:#2C3530;background:#F2EDE0;padding:24px">${inner}<p style="opacity:0.7;font-size:12px">36 m s.l.m. — polesineparmense36.it</p></div>`;

export const tpl = {
  adminEventSignup: (slug: string, name: string, email: string, people: number, notes?: string) =>
    wrap(`<h2>Nuova iscrizione evento</h2><p><b>${slug}</b></p><p>${name} &lt;${email}&gt; · ${people} persone</p>${notes ? `<p>${notes}</p>` : ''}`),
  userEventSignupConfirm: (slug: string, name: string) =>
    wrap(`<h2>Iscrizione ricevuta</h2><p>Ciao ${name}, abbiamo ricevuto la tua iscrizione a <b>${slug}</b>. A presto!</p>`),
  adminTessera: (data: Record<string, unknown>) => wrap(`<h2>Richiesta tessera</h2><pre>${JSON.stringify(data, null, 2)}</pre>`),
  adminVolunteer: (data: Record<string, unknown>) => wrap(`<h2>Volontario</h2><pre>${JSON.stringify(data, null, 2)}</pre>`),
  adminReport: (data: Record<string, unknown>) => wrap(`<h2>Segnalazione</h2><pre>${JSON.stringify(data, null, 2)}</pre>`),
  adminContact: (data: Record<string, unknown>) => wrap(`<h2>Contatto</h2><pre>${JSON.stringify(data, null, 2)}</pre>`),
  adminPressRequest: (id: string, outlet: string, name: string, email: string, purpose: string) =>
    wrap(`<h2>Richiesta press</h2><p><b>${outlet}</b> — ${name} &lt;${email}&gt;</p><p>${purpose}</p><p>Approva in /admin/press-requests/${id}</p>`),
  pressApproved: (downloadUrl: string, expires: Date) =>
    wrap(`<h2>Foto approvate</h2><p>Link scaricabile (scade ${expires.toISOString()}):</p><p><a href="${downloadUrl}">${downloadUrl}</a></p>`),
  magicLink: (url: string) =>
    wrap(`<h2>Accesso admin</h2><p><a href="${url}">Clicca per accedere</a> (valido 15 minuti)</p>`),
};
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(email): resend client + html templates"
```

---

## Task 14: API handlers — event-signup, tessera, volunteer, report, contact

**Files:**
- Create: `src/pages/api/event-signup.ts`, `src/pages/api/tessera.ts`, `src/pages/api/volunteer.ts`, `src/pages/api/report.ts`, `src/pages/api/contact.ts`, `src/pages/[lang]/grazie.astro`
- Create test: `tests/api/event-signup.test.ts`

- [ ] **Step 1: Pagina "grazie"**

`src/pages/[lang]/grazie.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
---
<Base title={t('common.thanks')}>
  <article class="mx-auto max-w-prose text-center">
    <h1 class="text-6xl">{t('common.thanks')}</h1>
    <p class="mt-6 prose">Riceverai una conferma via email.</p>
  </article>
</Base>
```

- [ ] **Step 2: Test event-signup (TDD)**

`tests/api/event-signup.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/db/client', () => ({ db: { insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })) } }));
vi.mock('../../src/lib/email/resend', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '../../src/pages/api/event-signup';
import { db } from '../../src/lib/db/client';
import { sendEmail } from '../../src/lib/email/resend';

function fd(payload: Record<string, string>) {
  const body = new URLSearchParams(payload).toString();
  return new Request('http://x/api/event-signup', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/event-signup', () => {
  it('rejects invalid', async () => {
    const res = await POST({ request: fd({ eventSlug: '', name: '', email: 'nope', people: '1' }) } as any);
    expect(res.status).toBe(400);
  });
  it('inserts and emails on valid', async () => {
    const res = await POST({ request: fd({ eventSlug: 'it/x', name: 'A', email: 'a@b.it', people: '2' }) } as any);
    expect(res.status).toBe(303);
    expect(db.insert).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run → fail**

Run: `npm test`
Expected: FAIL (POST non esiste).

- [ ] **Step 4: Implementare `src/pages/api/event-signup.ts`**

```ts
import type { APIRoute } from 'astro';
import { eventSignupSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { eventSignups } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  const parsed = eventSignupSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  const { eventSlug, name, email, people, notes } = parsed.data;
  await db.insert(eventSignups).values({ eventSlug, name, email, people, notes });
  await sendEmail({ to: env.ADMIN_EMAIL, subject: `Iscrizione: ${eventSlug}`, html: tpl.adminEventSignup(eventSlug, name, email, people, notes), replyTo: email });
  await sendEmail({ to: email, subject: 'Iscrizione ricevuta', html: tpl.userEventSignupConfirm(eventSlug, name) });
  const lang = eventSlug.startsWith('en/') ? 'en' : 'it';
  return thanksRedirect(lang);
};
```

- [ ] **Step 5: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Implementare gli altri 4 handler (stesso pattern)**

`src/pages/api/tessera.ts`:

```ts
import type { APIRoute } from 'astro';
import { tesseraSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { tesseraRequests } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  const parsed = tesseraSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  const { privacy, ...rest } = parsed.data;
  await db.insert(tesseraRequests).values(rest);
  await sendEmail({ to: env.ADMIN_EMAIL, subject: 'Richiesta tessera', html: tpl.adminTessera(rest), replyTo: rest.email });
  return thanksRedirect('it');
};
```

`src/pages/api/volunteer.ts`:

```ts
import type { APIRoute } from 'astro';
import { volunteerSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { volunteerRequests } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  const parsed = volunteerSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  await db.insert(volunteerRequests).values(parsed.data);
  await sendEmail({ to: env.ADMIN_EMAIL, subject: 'Volontario', html: tpl.adminVolunteer(parsed.data), replyTo: parsed.data.email });
  return thanksRedirect('it');
};
```

`src/pages/api/report.ts`:

```ts
import type { APIRoute } from 'astro';
import { reportSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { reports } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  await db.insert(reports).values(parsed.data);
  await sendEmail({ to: env.ADMIN_EMAIL, subject: `Segnalazione: ${parsed.data.kind}`, html: tpl.adminReport(parsed.data), replyTo: parsed.data.email });
  return thanksRedirect('it');
};
```

`src/pages/api/contact.ts`:

```ts
import type { APIRoute } from 'astro';
import { contactSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { contactMessages } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  await db.insert(contactMessages).values(parsed.data);
  await sendEmail({ to: env.ADMIN_EMAIL, subject: 'Contatto sito', html: tpl.adminContact(parsed.data), replyTo: parsed.data.email });
  return thanksRedirect('it');
};
```

- [ ] **Step 7: Run all tests + build**

Run: `npm test && npm run build`
Expected: PASS, build OK.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(api): event-signup + tessera + volunteer + report + contact"
```

---

## Task 15: Replit Object Storage wrapper

**Files:**
- Create: `src/lib/photos/storage.ts`

- [ ] **Step 1: Install client**

```bash
npm install @replit/object-storage
```

- [ ] **Step 2: `src/lib/photos/storage.ts`**

```ts
import { Client } from '@replit/object-storage';
import { env } from '../env';

const original = new Client({ bucketId: env.OBJECT_STORAGE_BUCKET_ORIGINAL });
const web = new Client({ bucketId: env.OBJECT_STORAGE_BUCKET_WEB });

export async function putOriginal(key: string, data: Buffer) {
  const r = await original.uploadFromBytes(key, data);
  if (!r.ok) throw new Error(`upload original: ${r.error?.message}`);
}

export async function putWeb(key: string, data: Buffer, contentType: string) {
  const r = await web.uploadFromBytes(key, data, { headers: { 'content-type': contentType } });
  if (!r.ok) throw new Error(`upload web: ${r.error?.message}`);
}

export async function getOriginal(key: string): Promise<Buffer> {
  const r = await original.downloadAsBytes(key);
  if (!r.ok) throw new Error(`download original: ${r.error?.message}`);
  return Buffer.from(r.value);
}

export function publicUrl(key: string): string {
  return `${env.OBJECT_STORAGE_PUBLIC_URL}/${key}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(storage): replit object storage wrapper"
```

---

## Task 16: Watermark pipeline con sharp (TDD)

**Files:**
- Create: `src/lib/photos/watermark.ts`, `src/lib/photos/exif.ts`, `tests/unit/watermark.test.ts`, `tests/unit/exif.test.ts`, `tests/fixtures/sample.jpg` (qualunque jpg)

- [ ] **Step 1: Install sharp**

```bash
npm install sharp exifr piexifjs
npm install -D @types/node
```

- [ ] **Step 2: Test watermark + sizes**

`tests/unit/watermark.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { processPhoto, SIZES } from '../../src/lib/photos/watermark';
import { readFileSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { join } from 'node:path';

const fixture = join(__dirname, '..', 'fixtures', 'sample.jpg');
const skip = !existsSync(fixture);

describe.skipIf(skip)('processPhoto', () => {
  const input = skip ? Buffer.alloc(0) : readFileSync(fixture);

  it('produces all sizes', async () => {
    const out = await processPhoto(input);
    for (const s of Object.keys(SIZES)) expect(out[s as keyof typeof SIZES]).toBeInstanceOf(Buffer);
  });

  it('thumbnail is much smaller than large', async () => {
    const out = await processPhoto(input);
    expect(out.thumb.byteLength).toBeLessThan(out.large.byteLength);
  });

  it('outputs are valid jpeg with width <= target', async () => {
    const out = await processPhoto(input);
    const meta = await sharp(out.medium).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBeLessThanOrEqual(SIZES.medium);
  });
});
```

- [ ] **Step 3: Test exif**

`tests/unit/exif.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stampCopyrightExif, readExifSummary } from '../../src/lib/photos/exif';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const fixture = join(__dirname, '..', 'fixtures', 'sample.jpg');
const skip = !existsSync(fixture);

describe.skipIf(skip)('exif', () => {
  it('stamps copyright/artist/source', async () => {
    const input = readFileSync(fixture);
    const out = await stampCopyrightExif(input, { artist: 'Mario Rossi' });
    const summary = await readExifSummary(out);
    expect(summary.copyright).toContain('36 m s.l.m.');
    expect(summary.artist).toContain('Mario Rossi');
    expect(summary.source).toContain('polesineparmense36.it');
  });
});
```

- [ ] **Step 4: Run → fail**

Run: `npm test`
Expected: FAIL (moduli non esistono).

- [ ] **Step 5: Implementare `src/lib/photos/watermark.ts`**

```ts
import sharp from 'sharp';

export const SIZES = { thumb: 320, small: 640, medium: 1200, large: 2000 } as const;
export type SizeKey = keyof typeof SIZES;

const WATERMARK_TEXT = '© 36 m s.l.m.';

function svgWatermark(width: number): Buffer {
  const fontSize = Math.max(14, Math.round(width / 36));
  const padding = Math.round(fontSize * 0.6);
  const w = Math.round(WATERMARK_TEXT.length * fontSize * 0.55) + padding * 2;
  const h = fontSize + padding * 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
       <style>.t{font-family:Inter,Arial,sans-serif;font-size:${fontSize}px;fill:white;opacity:0.85}</style>
       <rect width="100%" height="100%" fill="black" opacity="0.35" rx="6"/>
       <text x="${padding}" y="${h - padding}" class="t">${WATERMARK_TEXT}</text>
     </svg>`,
  );
}

export async function processPhoto(input: Buffer): Promise<Record<SizeKey, Buffer>> {
  const out = {} as Record<SizeKey, Buffer>;
  for (const [key, target] of Object.entries(SIZES) as [SizeKey, number][]) {
    const resized = sharp(input).rotate().resize({ width: target, withoutEnlargement: true });
    const meta = await resized.clone().metadata();
    const wmWidth = Math.round((meta.width ?? target) * 0.45);
    const wm = svgWatermark(wmWidth);
    out[key] = await resized
      .composite([{ input: wm, gravity: 'southeast' }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  }
  return out;
}
```

- [ ] **Step 6: Implementare `src/lib/photos/exif.ts`**

```ts
import piexif from 'piexifjs';
import exifr from 'exifr';

const SOURCE = 'polesineparmense36.it';
const COPYRIGHT = '© Associazione 36 m s.l.m.';

export async function stampCopyrightExif(input: Buffer, opts: { artist?: string }): Promise<Buffer> {
  const dataUrl = `data:image/jpeg;base64,${input.toString('base64')}`;
  let exifObj: any;
  try { exifObj = piexif.load(dataUrl); } catch { exifObj = { '0th': {}, Exif: {}, GPS: {}, Interop: {}, '1st': {}, thumbnail: null }; }
  exifObj['0th'][piexif.ImageIFD.Copyright] = COPYRIGHT;
  if (opts.artist) exifObj['0th'][piexif.ImageIFD.Artist] = opts.artist;
  exifObj['0th'][piexif.ImageIFD.ImageDescription] = SOURCE;
  const exifBytes = piexif.dump(exifObj);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  const base64 = newDataUrl.replace(/^data:image\/jpeg;base64,/, '');
  return Buffer.from(base64, 'base64');
}

export async function readExifSummary(buf: Buffer): Promise<{ copyright?: string; artist?: string; source?: string; raw: Record<string, unknown> }> {
  const raw = (await exifr.parse(buf, { translateValues: false, translateKeys: true })) ?? {};
  return {
    copyright: raw.Copyright as string | undefined,
    artist: raw.Artist as string | undefined,
    source: raw.ImageDescription as string | undefined,
    raw: raw as Record<string, unknown>,
  };
}
```

- [ ] **Step 7: Mettere fixture JPG**

Aggiungere un piccolo file JPG di test in `tests/fixtures/sample.jpg` (può essere qualsiasi foto reale).

- [ ] **Step 8: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(photos): sharp watermark pipeline + exif stamping"
```

---

## Task 17: Magic-link auth admin (TDD)

**Files:**
- Create: `src/lib/auth/magicLink.ts`, `src/lib/auth/session.ts`, `tests/unit/magicLink.test.ts`

- [ ] **Step 1: Test fallente**

`tests/unit/magicLink.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateToken, hashToken, verifyToken } from '../../src/lib/auth/magicLink';

describe('magicLink', () => {
  it('generates url-safe tokens', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{32,}$/);
  });
  it('hash is stable and verify works', () => {
    const t = generateToken();
    const h = hashToken(t);
    expect(verifyToken(t, h)).toBe(true);
    expect(verifyToken('other', h)).toBe(false);
  });
});
```

- [ ] **Step 2: Run → fail**

- [ ] **Step 3: `src/lib/auth/magicLink.ts`**

```ts
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../env';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
export function hashToken(token: string): string {
  return createHmac('sha256', env.SESSION_SECRET || 'dev-secret').update(token).digest('hex');
}
export function verifyToken(token: string, expectedHash: string): boolean {
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
```

- [ ] **Step 4: `src/lib/auth/session.ts`**

```ts
import { db } from '../db/client';
import { adminSessions } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { generateToken } from './magicLink';
import { env } from '../env';

const COOKIE = 'p36_admin';
const TTL_MS = 1000 * 60 * 60 * 24 * 14;

export async function createSession(email: string): Promise<string> {
  const id = generateToken(24);
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(adminSessions).values({ id, email, expiresAt });
  return id;
}

export async function getSession(cookieHeader: string | null): Promise<{ email: string } | null> {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return null;
  const id = m[1];
  const rows = await db.select().from(adminSessions).where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date())));
  return rows[0] ? { email: rows[0].email } : null;
}

export function sessionCookie(id: string): string {
  const secure = env.SITE_URL.startsWith('https');
  return `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(TTL_MS / 1000)}${secure ? '; Secure' : ''}`;
}

export function clearedCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const ADMIN_EMAILS = (env.ADMIN_EMAIL || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
```

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add -A
git commit -m "feat(auth): magic-link tokens + admin session"
```

---

## Task 18: API auth — request + verify

**Files:**
- Create: `src/pages/api/auth/request.ts`, `src/pages/api/auth/verify.ts`, `src/pages/[lang]/admin-login-sent.astro`

- [ ] **Step 1: `request.ts`**

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { readForm, jsonError } from '../../../lib/forms/respond';
import { db } from '../../../lib/db/client';
import { adminMagicLinks } from '../../../lib/db/schema';
import { generateToken, hashToken } from '../../../lib/auth/magicLink';
import { isAdminEmail } from '../../../lib/auth/session';
import { sendEmail } from '../../../lib/email/resend';
import { tpl } from '../../../lib/email/templates';
import { env } from '../../../lib/env';

export const prerender = false;
const schema = z.object({ email: z.string().email() });

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await readForm(request);
  const parsed = schema.safeParse(data);
  if (!parsed.success) return jsonError('Email non valida');
  const { email } = parsed.data;
  if (isAdminEmail(email)) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    await db.insert(adminMagicLinks).values({ token: tokenHash, email, expiresAt: new Date(Date.now() + 1000 * 60 * 15) });
    const url = `${env.SITE_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: email, subject: 'Accesso admin', html: tpl.magicLink(url) });
  }
  return redirect('/it/admin-login-sent');
};
```

- [ ] **Step 2: `verify.ts`**

```ts
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/client';
import { adminMagicLinks } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashToken } from '../../../lib/auth/magicLink';
import { createSession, sessionCookie, isAdminEmail } from '../../../lib/auth/session';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 400 });
  const h = hashToken(token);
  const rows = await db.select().from(adminMagicLinks).where(eq(adminMagicLinks.token, h));
  const row = rows[0];
  if (!row || row.usedAt || row.expiresAt < new Date() || !isAdminEmail(row.email)) {
    return new Response('Link non valido o scaduto', { status: 400 });
  }
  await db.update(adminMagicLinks).set({ usedAt: new Date() }).where(eq(adminMagicLinks.token, h));
  const sid = await createSession(row.email);
  return new Response(null, { status: 302, headers: { Location: '/admin', 'Set-Cookie': sessionCookie(sid) } });
};
```

- [ ] **Step 3: `admin-login-sent.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import type { Lang } from '../../i18n/ui';
export function getStaticPaths() { return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }]; }
const lang = Astro.params.lang as Lang;
---
<Base title="Email inviata">
  <article class="mx-auto max-w-prose text-center">
    <h1 class="text-5xl">Controlla la mail</h1>
    <p class="prose mt-6">Se l'indirizzo è abilitato, riceverai un link per accedere (valido 15 minuti).</p>
  </article>
</Base>
```

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(auth): magic-link request + verify endpoints"
```

---

## Task 19: Admin login page + middleware admin

**Files:**
- Create: `src/middleware.ts`, `src/pages/admin/login.astro`, `src/pages/admin/index.astro`

- [ ] **Step 1: `src/middleware.ts`**

```ts
import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth/session';

export const onRequest = defineMiddleware(async ({ request, url, redirect, locals }, next) => {
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
    const session = await getSession(request.headers.get('cookie'));
    if (!session) return redirect('/admin/login');
    (locals as any).admin = session;
  }
  return next();
});
```

- [ ] **Step 2: `src/pages/admin/login.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
---
<Base title="Admin login">
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">Accesso admin</h1>
    <form method="POST" action="/api/auth/request" class="mt-6 grid gap-3 rounded-2xl border border-argento p-6">
      <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
      <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia magic link</button>
    </form>
  </article>
</Base>
```

- [ ] **Step 3: `src/pages/admin/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
const admin = (Astro.locals as any).admin;
---
<Base title="Admin">
  <h1 class="text-5xl">Admin</h1>
  <p class="mt-4 opacity-80">Loggato come {admin?.email}</p>
  <ul class="mt-6 grid gap-3 md:grid-cols-2">
    <li><a class="block rounded-2xl border border-argento p-4 no-underline" href="/admin/photos">Carica foto</a></li>
    <li><a class="block rounded-2xl border border-argento p-4 no-underline" href="/admin/press-requests">Richieste press</a></li>
  </ul>
</Base>
```

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(admin): login page + middleware gate"
```

---

## Task 20: Admin upload foto (UI + API)

**Files:**
- Create: `src/pages/admin/photos.astro`, `src/pages/api/upload-photo.ts`
- Create test: `tests/api/upload-photo.test.ts`

- [ ] **Step 1: Test (mock-heavy)**

`tests/api/upload-photo.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/lib/auth/session', () => ({ getSession: vi.fn().mockResolvedValue({ email: 'admin@x' }) }));
vi.mock('../../src/lib/photos/storage', () => ({ putOriginal: vi.fn(), putWeb: vi.fn(), publicUrl: (k: string) => `https://cdn/${k}` }));
vi.mock('../../src/lib/photos/watermark', () => ({
  processPhoto: vi.fn().mockResolvedValue({ thumb: Buffer.from('a'), small: Buffer.from('b'), medium: Buffer.from('c'), large: Buffer.from('d') }),
  SIZES: { thumb: 1, small: 1, medium: 1, large: 1 },
}));
vi.mock('../../src/lib/photos/exif', () => ({
  stampCopyrightExif: vi.fn(async (b: Buffer) => b),
  readExifSummary: vi.fn().mockResolvedValue({ raw: {} }),
}));
vi.mock('../../src/lib/db/client', () => ({ db: { insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })) } }));

import { POST } from '../../src/pages/api/upload-photo';

beforeEach(() => vi.clearAllMocks());

function buildReq(formFields: Record<string, string>, file?: { name: string; bytes: Uint8Array }) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(formFields)) fd.append(k, v);
  if (file) fd.append('file', new File([file.bytes], file.name, { type: 'image/jpeg' }));
  return new Request('http://x/api/upload-photo', { method: 'POST', body: fd, headers: { cookie: 'p36_admin=abc' } });
}

describe('POST /api/upload-photo', () => {
  it('rejects unauthenticated', async () => {
    const { getSession } = await import('../../src/lib/auth/session');
    (getSession as any).mockResolvedValueOnce(null);
    const res = await POST({ request: buildReq({ title: 'x' }, { name: 'a.jpg', bytes: new Uint8Array([1,2,3]) }) } as any);
    expect(res.status).toBe(401);
  });
  it('rejects missing file', async () => {
    const res = await POST({ request: buildReq({ title: 'x' }) } as any);
    expect(res.status).toBe(400);
  });
  it('processes and inserts on valid', async () => {
    const res = await POST({ request: buildReq({ title: 'Pioppi', author: 'Mario', pressKitVisible: 'on' }, { name: 'p.jpg', bytes: new Uint8Array([1,2,3]) }) } as any);
    expect([200, 303]).toContain(res.status);
  });
});
```

- [ ] **Step 2: Run → fail**

- [ ] **Step 3: Implementare `src/pages/api/upload-photo.ts`**

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../lib/auth/session';
import { jsonError } from '../../lib/forms/respond';
import { processPhoto } from '../../lib/photos/watermark';
import { stampCopyrightExif, readExifSummary } from '../../lib/photos/exif';
import { putOriginal, putWeb } from '../../lib/photos/storage';
import { db } from '../../lib/db/client';
import { photos } from '../../lib/db/schema';
import { slugify } from '../../lib/slug';

export const prerender = false;
const meta = z.object({
  title: z.string().min(1),
  caption: z.string().optional(),
  author: z.string().optional(),
  tags: z.string().optional(),
  pressKitVisible: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers.get('cookie'));
  if (!session) return new Response('unauthorized', { status: 401 });

  const fd = await request.formData();
  const file = fd.get('file');
  if (!(file instanceof File) || file.size === 0) return jsonError('File mancante');
  const parsed = meta.safeParse({
    title: fd.get('title'),
    caption: fd.get('caption') ?? undefined,
    author: fd.get('author') ?? undefined,
    tags: fd.get('tags') ?? undefined,
    pressKitVisible: fd.get('pressKitVisible') ?? undefined,
  });
  if (!parsed.success) return jsonError('Metadati non validi');

  const buf = Buffer.from(await file.arrayBuffer());
  const stamped = await stampCopyrightExif(buf, { artist: parsed.data.author });
  const slug = `${Date.now()}-${slugify(parsed.data.title)}`;
  await putOriginal(`${slug}.jpg`, stamped);

  const sizes = await processPhoto(stamped);
  const webKeys = {
    thumb: `${slug}/thumb.jpg`,
    small: `${slug}/small.jpg`,
    medium: `${slug}/medium.jpg`,
    large: `${slug}/large.jpg`,
  };
  await Promise.all([
    putWeb(webKeys.thumb, sizes.thumb, 'image/jpeg'),
    putWeb(webKeys.small, sizes.small, 'image/jpeg'),
    putWeb(webKeys.medium, sizes.medium, 'image/jpeg'),
    putWeb(webKeys.large, sizes.large, 'image/jpeg'),
  ]);

  const exif = await readExifSummary(stamped);
  const tags = (parsed.data.tags ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  await db.insert(photos).values({
    slug,
    title: parsed.data.title,
    caption: parsed.data.caption,
    author: parsed.data.author,
    tags,
    originalKey: `${slug}.jpg`,
    webKeys,
    exif: exif.raw,
    pressKitVisible: !!parsed.data.pressKitVisible,
  });

  return new Response(null, { status: 303, headers: { Location: '/admin/photos' } });
};
```

- [ ] **Step 4: `src/pages/admin/photos.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import { db } from '../../lib/db/client';
import { photos } from '../../lib/db/schema';
import { desc } from 'drizzle-orm';
import { publicUrl } from '../../lib/photos/storage';
const list = await db.select().from(photos).orderBy(desc(photos.createdAt)).limit(50);
---
<Base title="Foto admin">
  <h1 class="text-5xl">Foto</h1>
  <form method="POST" action="/api/upload-photo" enctype="multipart/form-data" class="mt-6 grid gap-3 rounded-2xl border border-argento p-6">
    <input type="file" name="file" accept="image/jpeg" required />
    <input name="title" placeholder="Titolo" required class="rounded border px-3 py-2" />
    <input name="caption" placeholder="Didascalia" class="rounded border px-3 py-2" />
    <input name="author" placeholder="Autore" class="rounded border px-3 py-2" />
    <input name="tags" placeholder="tag1, tag2" class="rounded border px-3 py-2" />
    <label class="flex items-center gap-2"><input type="checkbox" name="pressKitVisible" /> Visibile in press kit</label>
    <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Carica</button>
  </form>
  <ul class="mt-10 grid gap-4 md:grid-cols-3">
    {list.map((p) => (
      <li class="rounded-2xl border border-argento p-3">
        <img src={publicUrl(p.webKeys.small)} alt={p.title} class="w-full rounded-xl" />
        <p class="mt-2 font-semibold">{p.title}</p>
        <p class="text-xs opacity-70">{p.pressKitVisible ? 'press kit' : 'privata'}</p>
      </li>
    ))}
  </ul>
</Base>
```

- [ ] **Step 5: Run tests + build**

```bash
npm test && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): photo upload UI + watermark+exif pipeline endpoint"
```

---

## Task 21: Press kit gallery pubblica

**Files:**
- Create: `src/components/PressGalleryItem.astro`
- Modify: `src/pages/[lang]/chi-siamo/press-kit.astro`

- [ ] **Step 1: `PressGalleryItem.astro`**

```astro
---
import { publicUrl } from '../lib/photos/storage';
const { photo } = Astro.props;
---
<label class="block rounded-2xl border border-argento p-3">
  <img src={publicUrl(photo.webKeys.small)} alt={photo.title} class="w-full rounded-xl" />
  <p class="mt-2 text-sm">{photo.title}{photo.author ? ` — ${photo.author}` : ''}</p>
  <span class="mt-2 inline-flex items-center gap-2 text-xs">
    <input type="checkbox" name="photoIds" value={photo.id} /> Includi in richiesta
  </span>
</label>
```

- [ ] **Step 2: Aggiornare press-kit.astro**

```astro
---
import Base from '../../../layouts/Base.astro';
import PressRequestForm from '../../../components/forms/PressRequestForm.astro';
import PressGalleryItem from '../../../components/PressGalleryItem.astro';
import { db } from '../../../lib/db/client';
import { photos } from '../../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';
const list = await db.select().from(photos).where(eq(photos.pressKitVisible, true)).orderBy(desc(photos.createdAt));
---
<Base title="Press kit">
  <article class="mx-auto max-w-3xl">
    <h1 class="text-5xl">Press kit</h1>
    <p class="prose mt-6">Foto in anteprima watermarkate. Seleziona quelle d'interesse e compila il form: ricevi un link temporaneo per scaricare l'alta risoluzione una volta approvata la richiesta.</p>
  </article>
  <form method="POST" action="/api/press-request" class="mt-10 grid gap-6">
    <div class="grid gap-3 md:grid-cols-3">{list.map((p) => <PressGalleryItem photo={p} />)}</div>
    <fieldset class="grid gap-3 rounded-2xl border border-argento p-6 mx-auto w-full max-w-prose">
      <legend class="font-semibold">Richiedi alta risoluzione</legend>
      <label>Testata <input name="outlet" required class="block w-full rounded border px-3 py-2" /></label>
      <label>Nome <input name="name" required class="block w-full rounded border px-3 py-2" /></label>
      <label>Email <input type="email" name="email" required class="block w-full rounded border px-3 py-2" /></label>
      <label>Uso previsto <textarea name="purpose" rows="4" required class="block w-full rounded border px-3 py-2"></textarea></label>
      <button class="justify-self-start rounded-full bg-pioppo px-5 py-2 text-white">Invia richiesta</button>
    </fieldset>
  </form>
</Base>
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(press): public gallery + integrated request form"
```

---

## Task 22: Press request API + admin approva + download token

**Files:**
- Create: `src/pages/api/press-request.ts`, `src/pages/api/press-download/[token].ts`, `src/pages/admin/press-requests.astro`, `src/pages/api/press-approve.ts`
- Test: `tests/api/press-request.test.ts`

- [ ] **Step 1: Test press-request**

`tests/api/press-request.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/lib/db/client', () => ({ db: { insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })) } }));
vi.mock('../../src/lib/email/resend', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from '../../src/pages/api/press-request';
import { sendEmail } from '../../src/lib/email/resend';

function fd(payload: Record<string, string | string[]>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (Array.isArray(v)) v.forEach((x) => body.append(k, x));
    else body.append(k, v);
  }
  return new Request('http://x/api/press-request', { method: 'POST', body: body.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/press-request', () => {
  it('rejects without photoIds', async () => {
    const res = await POST({ request: fd({ outlet: 'X', name: 'Y', email: 'a@b.it', purpose: 'p' }) } as any);
    expect(res.status).toBe(400);
  });
  it('inserts and emails admin on valid', async () => {
    const res = await POST({ request: fd({
      outlet: 'X', name: 'Y', email: 'a@b.it', purpose: 'P',
      photoIds: ['11111111-1111-1111-1111-111111111111'],
    }) } as any);
    expect(res.status).toBe(303);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: `press-request.ts`**

```ts
import type { APIRoute } from 'astro';
import { pressRequestSchema } from '../../lib/forms/validators';
import { readForm, jsonError, thanksRedirect } from '../../lib/forms/respond';
import { db } from '../../lib/db/client';
import { pressRequests } from '../../lib/db/schema';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await readForm(request);
  if (typeof data.photoIds === 'string') data.photoIds = [data.photoIds];
  const parsed = pressRequestSchema.safeParse(data);
  if (!parsed.success) return jsonError('Dati non validi');
  const inserted = await db.insert(pressRequests).values({
    outlet: parsed.data.outlet,
    name: parsed.data.name,
    email: parsed.data.email,
    purpose: parsed.data.purpose,
    photoIds: parsed.data.photoIds,
  }).returning({ id: pressRequests.id });
  const id = inserted[0]?.id ?? '';
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `Richiesta press: ${parsed.data.outlet}`,
    html: tpl.adminPressRequest(id, parsed.data.outlet, parsed.data.name, parsed.data.email, parsed.data.purpose),
    replyTo: parsed.data.email,
  });
  return thanksRedirect('it');
};
```

- [ ] **Step 3: Run tests → pass**

- [ ] **Step 4: `press-approve.ts`**

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../lib/auth/session';
import { db } from '../../lib/db/client';
import { pressRequests } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken, hashToken } from '../../lib/auth/magicLink';
import { sendEmail } from '../../lib/email/resend';
import { tpl } from '../../lib/email/templates';
import { env } from '../../lib/env';

export const prerender = false;
const schema = z.object({ id: z.string().uuid() });

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request.headers.get('cookie'));
  if (!session) return new Response('unauthorized', { status: 401 });
  const fd = await request.formData();
  const parsed = schema.safeParse({ id: fd.get('id') });
  if (!parsed.success) return new Response('bad request', { status: 400 });
  const rows = await db.select().from(pressRequests).where(eq(pressRequests.id, parsed.data.id));
  const row = rows[0];
  if (!row) return new Response('not found', { status: 404 });
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.update(pressRequests).set({
    status: 'approved',
    approvedAt: new Date(),
    downloadToken: hashToken(token),
    downloadExpiresAt: expiresAt,
  }).where(eq(pressRequests.id, row.id));
  const url = `${env.SITE_URL}/api/press-download/${token}`;
  await sendEmail({ to: row.email, subject: 'Foto approvate', html: tpl.pressApproved(url, expiresAt) });
  return new Response(null, { status: 303, headers: { Location: '/admin/press-requests' } });
};
```

- [ ] **Step 5: `press-download/[token].ts`**

```ts
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/client';
import { pressRequests, photos } from '../../../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { hashToken } from '../../../lib/auth/magicLink';
import { getOriginal } from '../../../lib/photos/storage';
import JSZipMod from 'jszip';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const token = params.token as string | undefined;
  if (!token) return new Response('missing token', { status: 400 });
  const h = hashToken(token);
  const rows = await db.select().from(pressRequests).where(eq(pressRequests.downloadToken, h));
  const row = rows[0];
  if (!row || !row.downloadExpiresAt || row.downloadExpiresAt < new Date()) {
    return new Response('Link scaduto o non valido', { status: 410 });
  }
  const ph = await db.select().from(photos).where(inArray(photos.id, row.photoIds));
  const zip = new JSZipMod();
  for (const p of ph) {
    const buf = await getOriginal(p.originalKey);
    zip.file(`${p.slug}.jpg`, buf);
  }
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await db.update(pressRequests).set({ downloadedAt: new Date() }).where(eq(pressRequests.id, row.id));
  return new Response(out, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="press-${row.id}.zip"`,
    },
  });
};
```

- [ ] **Step 6: Install jszip**

```bash
npm install jszip
```

- [ ] **Step 7: `admin/press-requests.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import { db } from '../../lib/db/client';
import { pressRequests } from '../../lib/db/schema';
import { desc } from 'drizzle-orm';
const list = await db.select().from(pressRequests).orderBy(desc(pressRequests.createdAt)).limit(100);
---
<Base title="Press requests">
  <h1 class="text-5xl">Richieste press</h1>
  <table class="mt-6 w-full text-sm">
    <thead><tr class="text-left"><th>Data</th><th>Testata</th><th>Email</th><th>Foto</th><th>Stato</th><th></th></tr></thead>
    <tbody>
      {list.map((r) => (
        <tr class="border-b border-argento">
          <td>{r.createdAt.toISOString().slice(0, 10)}</td>
          <td>{r.outlet}</td>
          <td>{r.email}</td>
          <td>{r.photoIds.length}</td>
          <td>{r.status}</td>
          <td>
            {r.status === 'pending' && (
              <form method="POST" action="/api/press-approve">
                <input type="hidden" name="id" value={r.id} />
                <button class="rounded-full bg-pioppo px-3 py-1 text-white">Approva</button>
              </form>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Base>
```

- [ ] **Step 8: Build + commit**

```bash
npm test && npm run build
git add -A
git commit -m "feat(press): request + admin approval + signed zip download"
```

---

## Task 23: Mappe Leaflet (eventi, itinerari, places)

**Files:**
- Create: `src/components/Map.astro`
- Modify: `src/pages/[lang]/eventi/[slug].astro`, `src/pages/[lang]/scopri/territorio/itinerari/[slug].astro`, `src/pages/[lang]/scopri/territorio/places/[slug].astro`

- [ ] **Step 1: `src/components/Map.astro` (island, JS-only)**

```astro
---
const { lat, lng, zoom = 14, markers = [], gpx } = Astro.props as {
  lat: number; lng: number; zoom?: number; markers?: { lat: number; lng: number; label?: string }[]; gpx?: string;
};
const id = `map-${Math.random().toString(36).slice(2, 8)}`;
---
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<div id={id} style="height:360px" class="rounded-2xl overflow-hidden border border-argento" />
<script type="module" define:vars={{ id, lat, lng, zoom, markers, gpx }}>
  import L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js';
  const map = L.map(id).setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
  for (const m of markers) L.marker([m.lat, m.lng]).addTo(map).bindPopup(m.label ?? '');
  L.marker([lat, lng]).addTo(map);
  if (gpx) {
    const gx = await import('https://unpkg.com/leaflet-gpx@2.1.2/gpx.js');
    new gx.default.GPX(gpx, { async: true }).on('loaded', (e) => map.fitBounds(e.target.getBounds())).addTo(map);
  }
</script>
```

- [ ] **Step 2: Includere mappa in pagina dettaglio evento (se `coords`)**

In `src/pages/[lang]/eventi/[slug].astro`, dopo il blocco `<Content />`:

```astro
{entry.data.coords && (
  <div class="mt-8">
    <Map lat={entry.data.coords[0]} lng={entry.data.coords[1]} markers={[{ lat: entry.data.coords[0], lng: entry.data.coords[1], label: entry.data.location }]} />
  </div>
)}
```

E aggiungere import all'inizio:

```astro
import Map from '../../../components/Map.astro';
```

- [ ] **Step 3: Stessa cosa in places (se `coords`) e itinerari (con `gpx` se presente)**

In `places/[slug].astro`:

```astro
import Map from '../../../../../components/Map.astro';
...
{entry.data.coords && <div class="mt-8"><Map lat={entry.data.coords[0]} lng={entry.data.coords[1]} markers={[{ lat: entry.data.coords[0], lng: entry.data.coords[1], label: entry.data.title }]} /></div>}
```

In `itinerari/[slug].astro`:

```astro
import Map from '../../../../../components/Map.astro';
...
{entry.data.bbox && (
  <div class="mt-8">
    <Map lat={(entry.data.bbox[1]+entry.data.bbox[3])/2} lng={(entry.data.bbox[0]+entry.data.bbox[2])/2} zoom={13} gpx={entry.data.gpx} />
  </div>
)}
```

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add -A
git commit -m "feat(maps): leaflet island for events, places, itineraries"
```

---

## Task 24: SEO base — sitemap, robots, meta open-graph

**Files:**
- Create: `public/robots.txt`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: `public/robots.txt`**

```
User-agent: *
Disallow: /admin
Disallow: /api/
Sitemap: https://www.polesineparmense36.it/sitemap-index.xml
```

- [ ] **Step 2: Aggiungere meta og e canonical a `Base.astro`**

Sostituire l'`<head>` per includere:

```astro
<link rel="canonical" href={Astro.url.href} />
<meta property="og:title" content={title} />
{description && <meta property="og:description" content={description} />}
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url.href} />
<meta property="og:locale" content={lang === 'it' ? 'it_IT' : 'en_US'} />
```

- [ ] **Step 3: Build (sitemap auto-generato)**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(seo): robots.txt + og meta + canonical"
```

---

## Task 25: Scraper sito legacy (Node)

**Files:**
- Create: `scripts/scrape-legacy.ts`, `scripts/inventory.ts`

- [ ] **Step 1: Install deps script**

```bash
npm install -D cheerio undici
```

- [ ] **Step 2: `scripts/scrape-legacy.ts`**

```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { request } from 'undici';

const ROOT = 'https://www.polesineparmense36.it';
const OUT = 'legacy';

const seeds = [
  '/', '/foto-storiche', '/proverbi', '/soprannomi', '/ricette', '/eventi', '/contatti', '/storia',
];

const visited = new Set<string>();
const queue = [...seeds];

async function fetch(path: string): Promise<string | null> {
  try {
    const res = await request(`${ROOT}${path}`, { headers: { 'user-agent': 'p36-redesign-scraper' } });
    if (res.statusCode >= 400) return null;
    return await res.body.text();
  } catch { return null; }
}

await mkdir(`${OUT}/pages`, { recursive: true });
await mkdir(`${OUT}/images`, { recursive: true });

const pages: { path: string; title: string; html: string; images: string[] }[] = [];

while (queue.length) {
  const path = queue.shift()!;
  if (visited.has(path)) continue;
  visited.add(path);
  const html = await fetch(path);
  if (!html) continue;
  const $ = cheerio.load(html);
  const title = $('title').first().text() || path;
  const images = $('img').map((_, el) => $(el).attr('src') ?? '').get().filter(Boolean);
  pages.push({ path, title, html, images });
  $('a[href^="/"]').each((_, a) => {
    const href = $(a).attr('href') ?? '';
    if (!visited.has(href) && !href.startsWith('/wp-') && !href.includes('#')) queue.push(href);
  });
  const safe = path === '/' ? 'index' : path.replace(/^\//, '').replace(/\//g, '_');
  await writeFile(join(OUT, 'pages', `${safe}.html`), html);
}

await writeFile(join(OUT, 'pages.json'), JSON.stringify(pages, null, 2));
console.log(`Scraped ${pages.length} pages.`);
```

- [ ] **Step 3: `scripts/inventory.ts`**

```ts
import { readFile, writeFile } from 'node:fs/promises';
type Page = { path: string; title: string; images: string[] };
const pages: Page[] = JSON.parse(await readFile('legacy/pages.json', 'utf8'));
const inv = pages.map((p) => ({
  path: p.path,
  title: p.title,
  imageCount: p.images.length,
  proposedSection: p.path.includes('foto') ? 'stories' : p.path.includes('ricett') ? 'recipes' : p.path.includes('eventi') ? 'events' : p.path.includes('proverb') || p.path.includes('soprannom') ? 'stories' : 'about',
  decision: 'TODO', // TIENI / RIVEDI / SCARTA
  notes: '',
}));
await writeFile('legacy/inventory.json', JSON.stringify(inv, null, 2));
console.log(`Inventory: ${inv.length} entries -> legacy/inventory.json`);
```

- [ ] **Step 4: Aggiungere script in package.json**

```json
"scripts": {
  ...
  "legacy:scrape": "tsx scripts/scrape-legacy.ts",
  "legacy:inventory": "tsx scripts/inventory.ts"
}
```

```bash
npm install -D tsx
```

- [ ] **Step 5: Aggiungere `legacy/pages` e `legacy/images` a `.gitignore` (già fatto in Task 1), tracciare solo `legacy/inventory.json` e `legacy/pages.json` no — solo `inventory.json`.**

In `.gitignore` confermare:

```
legacy/pages
legacy/images
legacy/pages.json
!legacy/inventory.json
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(migration): scraper + inventory generator"
```

---

## Task 26: Convertitore HTML→MDX (curation-driven)

**Files:**
- Create: `scripts/convert-to-mdx.ts`

- [ ] **Step 1: Install deps**

```bash
npm install -D turndown @types/turndown
```

- [ ] **Step 2: `scripts/convert-to-mdx.ts`**

```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { slugify } from '../src/lib/slug';

type InvEntry = { path: string; title: string; proposedSection: string; decision: 'TIENI'|'RIVEDI'|'SCARTA'|'TODO'; notes?: string };
const inventory: InvEntry[] = JSON.parse(await readFile('legacy/inventory.json', 'utf8'));
const pages: { path: string; title: string; html: string; images: string[] }[] = JSON.parse(await readFile('legacy/pages.json', 'utf8'));

const td = new TurndownService({ headingStyle: 'atx' });

const SECTION_DIR: Record<string, string> = {
  stories: 'src/content/stories/it',
  recipes: 'src/content/recipes/it',
  events: 'src/content/events/it',
  about: 'src/content/stories/it',
};

for (const entry of inventory) {
  if (entry.decision !== 'TIENI') continue;
  const page = pages.find((p) => p.path === entry.path);
  if (!page) continue;
  const $ = cheerio.load(page.html);
  $('script,style,nav,header,footer').remove();
  const main = $('main').html() ?? $('article').html() ?? $('body').html() ?? '';
  const md = td.turndown(main);
  const slug = slugify(entry.title);
  const dir = SECTION_DIR[entry.proposedSection] ?? 'src/content/stories/it';
  await mkdir(dir, { recursive: true });
  const fm = [
    '---',
    `title: "${entry.title.replace(/"/g, "'")}"`,
    `date: ${new Date().toISOString().slice(0, 10)}`,
    'draft: true',
    `tags: ["legacy"]`,
    '---',
    '',
    md,
  ].join('\n');
  await writeFile(join(dir, `${slug}.mdx`), fm);
  console.log(`+ ${dir}/${slug}.mdx`);
}
```

Aggiungere script:

```json
"legacy:convert": "tsx scripts/convert-to-mdx.ts"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(migration): html→mdx converter (curation-driven)"
```

---

## Task 27: Photo migration script

**Files:**
- Create: `scripts/process-photos.ts`

- [ ] **Step 1: `scripts/process-photos.ts`**

```ts
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { processPhoto } from '../src/lib/photos/watermark';
import { stampCopyrightExif, readExifSummary } from '../src/lib/photos/exif';
import { putOriginal, putWeb } from '../src/lib/photos/storage';
import { db } from '../src/lib/db/client';
import { photos } from '../src/lib/db/schema';
import { slugify } from '../src/lib/slug';

const SRC = 'legacy/images';
const exts = new Set(['.jpg', '.jpeg', '.JPG', '.JPEG']);

await mkdir(SRC, { recursive: true });
const files = (await readdir(SRC)).filter((f) => exts.has(extname(f)));

for (const f of files) {
  const buf = await readFile(join(SRC, f));
  const title = basename(f, extname(f)).replace(/[-_]/g, ' ');
  const slug = `${Date.now()}-${slugify(title)}`;
  const stamped = await stampCopyrightExif(buf, {});
  await putOriginal(`${slug}.jpg`, stamped);
  const sizes = await processPhoto(stamped);
  const webKeys = { thumb: `${slug}/thumb.jpg`, small: `${slug}/small.jpg`, medium: `${slug}/medium.jpg`, large: `${slug}/large.jpg` };
  await Promise.all([
    putWeb(webKeys.thumb, sizes.thumb, 'image/jpeg'),
    putWeb(webKeys.small, sizes.small, 'image/jpeg'),
    putWeb(webKeys.medium, sizes.medium, 'image/jpeg'),
    putWeb(webKeys.large, sizes.large, 'image/jpeg'),
  ]);
  const exif = await readExifSummary(stamped);
  await db.insert(photos).values({
    slug, title, originalKey: `${slug}.jpg`, webKeys, exif: exif.raw, pressKitVisible: false,
  });
  console.log(`✓ ${title}`);
}
```

Aggiungere script:

```json
"legacy:photos": "tsx scripts/process-photos.ts"
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(migration): photo processing script"
```

---

## Task 28: Replit Deploy + dominio

**Files:**
- Create: `.replit`, `replit.nix` (se non già generato), `README.md`

- [ ] **Step 1: `.replit`**

```
run = "npm run dev"
entrypoint = "src/pages/index.astro"

[deployment]
run = ["sh", "-c", "node dist/server/entry.mjs"]
build = ["sh", "-c", "npm run build"]
deploymentTarget = "cloudrun"

[env]
SITE_URL = "https://www.polesineparmense36.it"
```

- [ ] **Step 2: `README.md`**

Sezione di deploy:

```md
# Polesine 36 — sito APS

## Setup locale
1. `cp .env.example .env` e compilare i valori.
2. `npm install`
3. `npm run db:generate && npm run db:migrate`
4. `npm run dev`

## Deploy (Replit)
1. Configurare Secrets nello Repl: `DATABASE_URL`, `RESEND_API_KEY`, `SESSION_SECRET`, `OBJECT_STORAGE_PUBLIC_URL`, `ADMIN_EMAIL`.
2. Creare i bucket `photos-original` (privato) e `photos-web` (pubblico) in Object Storage.
3. Click "Deploy" su Replit; collegare il dominio `polesineparmense36.it`.

## Migrazione contenuti
1. `npm run legacy:scrape`
2. Editare `legacy/inventory.json` (decisione TIENI/RIVEDI/SCARTA per ogni voce).
3. `npm run legacy:convert`
4. `npm run legacy:photos` (con bucket configurati).
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add -A
git commit -m "chore(deploy): replit config + readme"
```

---

## Task 29: Self-test finale + Lighthouse manual check

- [ ] **Step 1: Run intero test suite**

Run: `npm test`
Expected: tutti i test passano.

- [ ] **Step 2: Run build pulito**

Run: `rm -rf dist && npm run build`
Expected: nessun errore, nessun warning di tipo.

- [ ] **Step 3: Smoke locale**

Run: `npm run preview`
Expected: navigare `/it/`, `/it/eventi`, `/it/eventi/2026-05-10-camminata-golena`, `/it/scopri/ricettario`, `/it/partecipa/tessera`, `/it/chi-siamo/press-kit`, `/en/`. Le pagine senza traduzione EN devono fare fallback a IT.

- [ ] **Step 4: Lighthouse mobile**

In Chrome DevTools, eseguire Lighthouse Mobile su `/it/` e `/it/eventi/<slug>`.
Target: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 95.
Se sotto soglia: lazy-load immagini grandi, ridurre font weight, comprimere webp.

- [ ] **Step 5: Commit eventuali fix**

```bash
git add -A
git commit -m "chore: lighthouse fixes"
```

---

## Self-Review (autore-piano)

**Spec coverage:** Le sezioni dello spec mappano a queste task —
- Architettura informativa → Task 5 (header), Task 7-10 (pagine)
- Funzionalità per area → Task 8-10 (pagine), Task 14 (form), Task 21-22 (press)
- Identità visiva → Task 2
- Architettura tecnica → Task 1-2-11-15-16-17-23
- Diritti foto A+B → Task 15-16-20-21-22 (originale privato + web watermarkato + EXIF + token signed)
- Bilinguismo → Task 4-5, fallback Astro i18n già configurato
- Migrazione → Task 25-26-27
- Cosa NON facciamo → rispettato (nessuna task introduce payment, newsletter, analytics, login utente)

**Placeholder scan:** ricerca di TBD/TODO/implement later → solo "TODO" come valore di default in `legacy/inventory.json` (legittimo: marca da scegliere).

**Type consistency:** `webKeys` ha sempre la stessa shape `{thumb,small,medium,large}` (Task 11 schema, Task 16 watermark `SIZES`, Task 20 upload, Task 27 migration). `pressRequests.photoIds` array di uuid coerente tra Task 11/22.

**Note di rischio:**
- Le viewport/percorsi di importazione in cartelle profonde (`scopri/territorio/itinerari`) usano `../../../../../`: ricontare i livelli al primo errore di build.
- Il client `@replit/object-storage` ha API che potrebbe richiedere lieve adattamento (verificare al runtime); fallback: usare `Bucket` API se i nomi cambiano.
- `leaflet-gpx` da CDN ESM è fragile; in caso di problemi, importare via npm e abilitare client-side directive `client:visible`.

---

## Stato

Plan completo. Prossimo step: scelta modalità di esecuzione.

**Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch fresh subagent per ogni task, review tra task, iterazione veloce.

**2. Inline Execution** — eseguire le task in questa sessione (executing-plans), batch con checkpoint per review.

Quale preferisci?
