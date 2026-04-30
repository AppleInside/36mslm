# Polesine 36 — Sotto-piano 1: Fondazioni

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Avere un sito Astro navigabile in IT/EN con palette "Pioppi & fiume", header/footer, lingua switcher, content collections con schemi e fixture, e una home page con prossimo evento + cards.

**Architecture:** Astro hybrid + TypeScript + Tailwind CSS + MDX content collections. Zero database, zero email, zero form attivi. Tutto deve girare con `npm run dev` e build pulita.

**Tech Stack:** Astro 4, TypeScript strict, Tailwind, MDX, Vitest.

**Riferimenti:**
- Spec: `docs/superpowers/specs/2026-04-30-polesine36-redesign-design.md`
- Piano monolitico (per riferimento futuro): `docs/superpowers/plans/2026-04-30-polesine36-implementation-monolitico.md`

**Esito atteso al termine:** sito navigabile su `/it/` e `/en/` con home (hero next event + 3 upcoming + 3 cards Scopri + 2 cards Partecipa), header con menu e lang switcher, footer con dati associazione. `npm run build` e `npm test` verdi.

**Sotto-piani successivi (NON in scope qui):**
- 02 — Sezioni statiche (eventi, scopri, partecipa, chi-siamo, contatti)
- 03 — Form + DB + email
- 04 — Foto + admin + press kit
- 05 — Mappe + SEO + migrazione + deploy

---

## File Structure (questo sotto-piano)

```
.
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── public/favicon.svg
├── src/
│   ├── consts.ts
│   ├── styles/global.css
│   ├── i18n/{ui.ts,utils.ts}
│   ├── lib/{slug.ts,dates.ts}
│   ├── content/
│   │   ├── config.ts
│   │   ├── events/it/2026-05-10-camminata-golena.mdx
│   │   ├── events/it/2026-06-15-festa-strolghino.mdx
│   │   ├── recipes/it/risotto-zucca.mdx
│   │   ├── itineraries/it/anello-golena.mdx
│   │   ├── stories/it/dialetto-pioppi.mdx
│   │   ├── notices/it/2026-04-15-assemblea.mdx
│   │   └── places/it/trattoria-al-cavallino.mdx
│   ├── layouts/Base.astro
│   ├── components/{Header,Footer,LangSwitcher,EventCard,HeroEvent}.astro
│   └── pages/
│       ├── index.astro
│       └── [lang]/index.astro
└── tests/unit/{slug,dates,i18n}.test.ts
```

---

## Task 1: Bootstrap Astro + TypeScript + Tailwind

**Files:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Init Astro template minimal**

```bash
npm create astro@latest -- . --template minimal --typescript strict --install --no-git --skip-houston
```

- [ ] **Step 2: Install integrazioni**

```bash
npm install @astrojs/mdx @astrojs/tailwind @astrojs/node
npm install -D tailwindcss vitest @types/node
```

- [ ] **Step 3: `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.polesineparmense36.it',
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
    fallback: { en: 'it' },
  },
});
```

- [ ] **Step 4: `.gitignore` (append)**

```
node_modules
dist
.astro
.env
.env.local
*.log
```

- [ ] **Step 5: `.env.example`**

```
SITE_URL=http://localhost:4321
```

- [ ] **Step 6: Build vuota OK**

Run: `npm run build`
Expected: build completa senza errori.

- [ ] **Step 7: Init git + commit**

```bash
git init
git add -A
git commit -m "chore: bootstrap astro + ts + tailwind + mdx"
```

---

## Task 2: Palette "Pioppi & fiume" + font

**Files:** `tailwind.config.mjs`, `src/styles/global.css`

- [ ] **Step 1: `tailwind.config.mjs`**

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
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: `src/styles/global.css`**

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

- [ ] **Step 3: Build verifica**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: tailwind palette pioppi & fiume + font caveat/inter"
```

---

## Task 3: Vitest setup + slugify (TDD)

**Files:** `vitest.config.ts`, `src/lib/slug.ts`, `tests/unit/slug.test.ts`, `package.json` (script)

- [ ] **Step 1: Aggiungere script test in `package.json`**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 3: Test fallente**

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

- [ ] **Step 4: Run → fail**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 5: `src/lib/slug.ts`**

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

- [ ] **Step 6: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(lib): slugify utility with tests"
```

---

## Task 4: i18n core (TDD)

**Files:** `src/i18n/ui.ts`, `src/i18n/utils.ts`, `tests/unit/i18n.test.ts`

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
    expect(t('footer.press')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run → fail**

- [ ] **Step 3: `src/i18n/ui.ts`**

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
    'nav.participate.volunteers': 'Volontari',
    'home.heroCta.signup': 'Iscriviti',
    'home.heroCta.allEvents': 'Tutti gli eventi',
    'common.next': 'Prossimo',
    'common.allEvents': 'Tutti gli eventi',
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
    'nav.participate.volunteers': 'Volunteers',
    'home.heroCta.signup': 'Sign up',
    'home.heroCta.allEvents': 'All events',
    'common.next': 'Next',
    'common.allEvents': 'All events',
    'footer.headquarters': 'Office',
  },
} as const;

export type UiKey = keyof typeof ui['it'];
```

- [ ] **Step 4: `src/i18n/utils.ts`**

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

- [ ] **Step 5: Run → pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(i18n): UI strings IT/EN + lang helpers"
```

---

## Task 5: Layout base + Header + Footer + LangSwitcher

**Files:** `src/consts.ts`, `src/components/{Header,Footer,LangSwitcher}.astro`, `src/layouts/Base.astro`, `public/favicon.svg`

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

- [ ] **Step 2: `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#A8B89B"/><text x="16" y="22" text-anchor="middle" font-family="Caveat, cursive" font-size="18" fill="#2C3530">36</text></svg>
```

- [ ] **Step 3: `src/components/LangSwitcher.astro`**

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

- [ ] **Step 4: `src/components/Header.astro`**

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

- [ ] **Step 5: `src/components/Footer.astro`**

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
    </div>
  </div>
</footer>
```

- [ ] **Step 6: `src/layouts/Base.astro`**

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
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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

- [ ] **Step 7: Build OK**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): base layout, header, footer, lang switcher"
```

---

## Task 6: Content collections + fixture

**Files:** `src/content/config.ts`, 7 fixture MDX in `src/content/{events,recipes,itineraries,stories,notices,places}/it/`

- [ ] **Step 1: `src/content/config.ts`**

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

- [ ] **Step 2: 7 fixture MDX**

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

- [ ] **Step 3: Build verifica schema**

Run: `npm run build`
Expected: build OK, content collections validate.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(content): collections schemas + initial fixtures"
```

---

## Task 7: Home page con Hero + cards (TDD su `dates`)

**Files:** `src/lib/dates.ts`, `tests/unit/dates.test.ts`, `src/components/{EventCard,HeroEvent}.astro`, `src/pages/index.astro`, `src/pages/[lang]/index.astro`

- [ ] **Step 1: Test dates fallente**

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

- [ ] **Step 3: `src/lib/dates.ts`**

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

- [ ] **Step 7: `src/pages/index.astro` (redirect)**

```astro
---
return Astro.redirect('/it/');
---
```

- [ ] **Step 8: `src/pages/[lang]/index.astro`**

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
  {upcoming.length > 0 && (
    <section class="mt-12">
      <h2 class="text-3xl">{t('common.allEvents')}</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">{upcoming.map((e) => <EventCard entry={e} />)}</div>
    </section>
  )}
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

- [ ] **Step 9: Build + smoke**

```bash
npm test
npm run build
npm run preview
```

Expected: tutti i test PASS, build OK, `/it/` mostra hero + 1 prossimo evento + cards Scopri + cards Partecipa. `/en/` stesso layout (le card delle pagine inesistenti puntano ancora a IT come fallback per ora — i link rotti saranno collegati nel sotto-piano 02).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(home): hero next event + upcoming + section grid"
```

---

## Self-Review

**Spec coverage (questo sotto-piano):**
- Palette + font ✓ (Task 2)
- Header con menu 5 voci + lang switcher ✓ (Task 5)
- Footer con CF, sede, link press ✓ (Task 5)
- Home con hero next event + upcoming + 3 cards Scopri + 2 cards Partecipa ✓ (Task 7)
- i18n IT/EN con fallback ✓ (Task 1+4)
- Content collections con tutti i tipi futuri ✓ (Task 6)

**Fuori scope (rimandato):** pagine eventi/scopri/partecipa/chi-siamo/contatti, form, DB, email, foto, mappe, SEO, deploy, migrazione legacy.

**Placeholder scan:** nessuno.

**Type consistency:** `Lang`, `UiKey` consistenti tra `ui.ts` e `utils.ts`. `entry.slug.replace(/^(it|en)\//, '')` usato uniformemente nelle card.

**Rischi noti:**
- Astro i18n con `prefixDefaultLocale: true` redireziona `/` a `/it/`, ma il file `src/pages/index.astro` con `Astro.redirect` è un fallback di sicurezza.
- I link nelle cards Scopri/Partecipa puntano a percorsi che ancora non esistono — comportamento atteso, saranno creati nel sotto-piano 02.

---

## Stato

Sotto-piano 1 pronto per esecuzione. Al termine: brainstorming/aggiornamento veloce → sotto-piano 2 (sezioni statiche).

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review tra task.

**2. Inline Execution** — eseguire qui in sessione, batch con checkpoint.

Quale preferisci?
