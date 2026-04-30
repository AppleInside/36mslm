# Sotto-piano 02 — Sezioni dinamiche (index + dettaglio)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire index e pagine di dettaglio per i 4 contenuti dinamici (eventi, ricette, itinerari, storie) e ripulire l'avviso di rotta duplicata `[lang]`.

**Architettura:** Pagine sotto `src/pages/[lang]/` che usano `getCollection` filtrando per prefisso `${lang}/`, con `getStaticPaths` per generare il dettaglio per ciascuna entry. Helper di selezione/sort condivisi in `src/lib/content.ts` (TDD). Fix del warning Astro rimuovendo la rotta orfana che collide con `[lang]/index.astro`.

**Tech Stack:** Astro 5 content collections, MDX render, Tailwind, Vitest.

**Fuori scope:** mappe Leaflet, form iscrizione, filtri client-side, paginazione, traduzioni EN delle entry, partecipa/chi-siamo/contatti statici (sotto-piano 03).

---

## Task 1 — Fix warning rotta i18n

**Files:** `astro.config.mjs`

Astro 5 con `i18n.routing.prefixDefaultLocale: true` genera già rotte per `/it` e `/en`. La nostra `src/pages/[lang]/index.astro` è la pagina canonica. Il warning «conflicts with higher priority route» va silenziato decidendo chi gestisce: rinunciamo al routing built-in e gestiamo manualmente le lingue (è già il pattern usato).

- [ ] **Step 1: Modifica `astro.config.mjs`**

Sostituisci l'oggetto `i18n` con questo (rimuove `routing` e `fallback`, lascia solo i metadati che usiamo nei componenti):

```js
i18n: {
  defaultLocale: 'it',
  locales: ['it', 'en'],
},
```

- [ ] **Step 2: Verifica build pulita**

Run: `npm run build`
Expected: nessun warning «Could not render `/it` from route `/[lang]`». `/it/index.html` e `/en/index.html` ancora generati. `/index.html` redirige a `/it/`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "fix(i18n): handle locales manually, remove route collision"
```

---

## Task 2 — Helper di selezione contenuti (TDD)

**Files:** `src/lib/content.ts`, `tests/unit/content.test.ts`

Helper riusati da tutte le pagine: `byLang`, `sortByDateAsc`, `sortByDateDesc`, `splitFutureFromPast` (per la pagina eventi).

- [ ] **Step 1: Test fallente** in `tests/unit/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { byLang, sortByDateAsc, sortByDateDesc, splitFutureFromPast } from '../../src/lib/content';

type E = { slug: string; data: { date: Date; draft?: boolean } };

const items: E[] = [
  { slug: 'it/a', data: { date: new Date('2026-01-01') } },
  { slug: 'en/b', data: { date: new Date('2026-02-01') } },
  { slug: 'it/c', data: { date: new Date('2026-03-01'), draft: true } },
  { slug: 'it/d', data: { date: new Date('2026-04-01') } },
];

describe('content helpers', () => {
  it('byLang filters by slug prefix and drops drafts', () => {
    const out = byLang(items, 'it');
    expect(out.map((e) => e.slug)).toEqual(['it/a', 'it/d']);
  });

  it('sortByDateAsc sorts ascending', () => {
    const out = sortByDateAsc([items[3], items[0]]);
    expect(out[0].slug).toBe('it/a');
  });

  it('sortByDateDesc sorts descending', () => {
    const out = sortByDateDesc([items[0], items[3]]);
    expect(out[0].slug).toBe('it/d');
  });

  it('splitFutureFromPast partitions on a reference date', () => {
    const ref = new Date('2026-02-15');
    const { future, past } = splitFutureFromPast(byLang(items, 'it'), ref);
    expect(future.map((e) => e.slug)).toEqual(['it/d']);
    expect(past.map((e) => e.slug)).toEqual(['it/a']);
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npm test`
Expected: FAIL `Cannot find module '../../src/lib/content'`.

- [ ] **Step 3: Implementa `src/lib/content.ts`**

```ts
import type { Lang } from '../i18n/ui';

type WithDate = { slug: string; data: { date: Date; draft?: boolean } };

export function byLang<T extends WithDate>(items: T[], lang: Lang): T[] {
  return items.filter((e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
}

export function sortByDateAsc<T extends WithDate>(items: T[]): T[] {
  return [...items].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function sortByDateDesc<T extends WithDate>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function splitFutureFromPast<T extends WithDate>(items: T[], now: Date): { future: T[]; past: T[] } {
  const future: T[] = [];
  const past: T[] = [];
  for (const e of items) {
    if (e.data.date.getTime() >= now.getTime()) future.push(e);
    else past.push(e);
  }
  return { future: sortByDateAsc(future), past: sortByDateDesc(past) };
}
```

- [ ] **Step 4: Run → pass**

Run: `npm test`
Expected: 4 nuovi test passano (totale 13).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): content selection helpers"
```

---

## Task 3 — Eventi: index + dettaglio

**Files:** `src/pages/[lang]/eventi/index.astro`, `src/pages/[lang]/eventi/[...slug].astro`

Index mostra: prossimi eventi (ordine cronologico) e archivio (ordine inverso). Dettaglio mostra titolo, data, luogo, corpo MDX.

- [ ] **Step 1: Crea `src/pages/[lang]/eventi/index.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import EventCard from '../../../components/EventCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../../i18n/utils';
import { byLang, splitFutureFromPast } from '../../../lib/content';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const all = await getCollection('events');
const { future, past } = splitFutureFromPast(byLang(all, lang), new Date());
---
<Base title={t('nav.events')}>
  <h1 class="text-5xl">{t('nav.events')}</h1>

  {future.length > 0 ? (
    <section class="mt-8">
      <h2 class="text-2xl">{t('common.allEvents')}</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">{future.map((e) => <EventCard entry={e} />)}</div>
    </section>
  ) : (
    <p class="mt-8 opacity-70">—</p>
  )}

  {past.length > 0 && (
    <section class="mt-12 opacity-80">
      <h2 class="text-2xl">Archivio</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-3">{past.map((e) => <EventCard entry={e} />)}</div>
    </section>
  )}
</Base>
```

- [ ] **Step 2: Crea `src/pages/[lang]/eventi/[...slug].astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import { formatEventDate, formatTime } from '../../../lib/dates';
import { useTranslations } from '../../../i18n/utils';
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
const t = useTranslations(lang);
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">
      {formatEventDate(entry.data.date, lang)} · {formatTime(entry.data.date, lang)}
    </p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <p class="mt-2 opacity-80">{entry.data.location}</p>
    <div class="prose mt-8"><Content /></div>
    {entry.data.signupRequired && (
      <p id="iscrivimi" class="mt-10 rounded-2xl border border-pioppo p-5">
        {t('home.heroCta.signup')} — modulo in arrivo. Per ora scrivi a <a href="mailto:info@polesineparmense36.it">info@polesineparmense36.it</a>.
      </p>
    )}
  </article>
</Base>
```

- [ ] **Step 3: Build OK**

Run: `npm run build`
Expected: build OK; `dist/it/eventi/index.html` e `dist/it/eventi/2026-05-10-camminata-golena/index.html` esistono.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(events): list and detail pages"
```

---

## Task 4 — Ricettario: index + dettaglio

**Files:** `src/pages/[lang]/scopri/ricettario/index.astro`, `src/pages/[lang]/scopri/ricettario/[...slug].astro`, `src/components/RecipeCard.astro`

- [ ] **Step 1: Crea `src/components/RecipeCard.astro`**

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/ricettario/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{entry.data.course}{entry.data.seasons.length > 0 && ` · ${entry.data.seasons.join(', ')}`}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  {entry.data.dialectName && <p class="mt-1 font-hand text-xl opacity-80">{entry.data.dialectName}</p>}
</a>
```

- [ ] **Step 2: Crea `src/pages/[lang]/scopri/ricettario/index.astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import RecipeCard from '../../../../components/RecipeCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../../../i18n/utils';
import { byLang, sortByDateDesc } from '../../../../lib/content';
import type { Lang } from '../../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const all = await getCollection('recipes');
const recipes = sortByDateDesc(byLang(all, lang));
---
<Base title={t('nav.discover.recipes')}>
  <h1 class="text-5xl">{t('nav.discover.recipes')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-3">{recipes.map((e) => <RecipeCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: Crea `src/pages/[lang]/scopri/ricettario/[...slug].astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../i18n/ui';

export async function getStaticPaths() {
  const all = await getCollection('recipes');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}

const { entry } = Astro.props;
const _lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{entry.data.course}{entry.data.seasons.length > 0 && ` · ${entry.data.seasons.join(', ')}`}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    {entry.data.dialectName && <p class="mt-2 font-hand text-3xl opacity-80">{entry.data.dialectName}</p>}
    <div class="prose mt-8"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 4: Build OK**

Run: `npm run build`
Expected: `dist/it/scopri/ricettario/index.html` e `dist/it/scopri/ricettario/risotto-zucca/index.html` esistono.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(recipes): list and detail pages"
```

---

## Task 5 — Storie: index + dettaglio

**Files:** `src/pages/[lang]/scopri/storie/index.astro`, `src/pages/[lang]/scopri/storie/[...slug].astro`, `src/components/StoryCard.astro`

- [ ] **Step 1: Crea `src/components/StoryCard.astro`**

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
import { formatEventDate } from '../lib/dates';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/storie/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}{entry.data.author && ` · ${entry.data.author}`}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  {entry.data.excerpt && <p class="mt-1 text-sm opacity-80">{entry.data.excerpt}</p>}
</a>
```

- [ ] **Step 2: Crea `src/pages/[lang]/scopri/storie/index.astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import StoryCard from '../../../../components/StoryCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../../../i18n/utils';
import { byLang, sortByDateDesc } from '../../../../lib/content';
import type { Lang } from '../../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const all = await getCollection('stories');
const stories = sortByDateDesc(byLang(all, lang));
---
<Base title={t('nav.discover.stories')}>
  <h1 class="text-5xl">{t('nav.discover.stories')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{stories.map((e) => <StoryCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: Crea `src/pages/[lang]/scopri/storie/[...slug].astro`**

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
    <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}{entry.data.author && ` · ${entry.data.author}`}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    {entry.data.excerpt && <p class="mt-3 max-w-prose opacity-80">{entry.data.excerpt}</p>}
    <div class="prose mt-8"><Content /></div>
  </article>
</Base>
```

- [ ] **Step 4: Build OK**

Run: `npm run build`
Expected: `dist/it/scopri/storie/index.html` e `dist/it/scopri/storie/dialetto-pioppi/index.html` esistono.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(stories): list and detail pages"
```

---

## Task 6 — Itinerari (sotto Territorio): index + dettaglio

**Files:** `src/pages/[lang]/scopri/territorio/index.astro` (alias verso itinerari per ora), `src/pages/[lang]/scopri/territorio/[...slug].astro`, `src/components/ItineraryCard.astro`

`territorio/index` mostra gli itinerari come prima sezione. Le directory di luoghi (places) restano fuori scope per ora — saranno aggiunte nel sotto-piano 03 con la mappa Leaflet.

- [ ] **Step 1: Crea `src/components/ItineraryCard.astro`**

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/territorio/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{entry.data.distanceKm} km · {entry.data.durationMin} min · {entry.data.difficulty}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
</a>
```

- [ ] **Step 2: Crea `src/pages/[lang]/scopri/territorio/index.astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import ItineraryCard from '../../../../components/ItineraryCard.astro';
import { getCollection } from 'astro:content';
import { useTranslations } from '../../../../i18n/utils';
import { byLang, sortByDateDesc } from '../../../../lib/content';
import type { Lang } from '../../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
const all = await getCollection('itineraries');
const itineraries = sortByDateDesc(byLang(all, lang));
---
<Base title={t('nav.discover.territory')}>
  <h1 class="text-5xl">{t('nav.discover.territory')}</h1>
  <p class="mt-3 max-w-prose opacity-80">Itinerari a piedi e in bicicletta tra il Po e i pioppi.</p>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{itineraries.map((e) => <ItineraryCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: Crea `src/pages/[lang]/scopri/territorio/[...slug].astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../i18n/ui';

export async function getStaticPaths() {
  const all = await getCollection('itineraries');
  return all.map((entry) => {
    const [lang, ...rest] = entry.slug.split('/');
    return { params: { lang, slug: rest.join('/') }, props: { entry } };
  });
}

const { entry } = Astro.props;
const _lang = Astro.params.lang as Lang;
const { Content } = await entry.render();
---
<Base title={entry.data.title}>
  <article class="mx-auto max-w-prose">
    <p class="text-xs uppercase tracking-wider text-po">{entry.data.distanceKm} km · {entry.data.durationMin} min · {entry.data.difficulty}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <div class="prose mt-8"><Content /></div>
    {(entry.data.gpx || entry.data.pdf) && (
      <ul class="mt-8 flex gap-4 text-sm">
        {entry.data.gpx && <li><a href={entry.data.gpx}>GPX</a></li>}
        {entry.data.pdf && <li><a href={entry.data.pdf}>PDF</a></li>}
      </ul>
    )}
  </article>
</Base>
```

- [ ] **Step 4: Build OK + run tests**

Run: `npm test && npm run build`
Expected: 13/13 test PASS; build OK senza warning di rotta; `dist/it/scopri/territorio/index.html` e `dist/it/scopri/territorio/anello-golena/index.html` esistono.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(territory): itineraries list and detail under territorio"
```

---

## Self-Review

**Spec coverage (questo sotto-piano):**
- Pagine eventi (lista + scheda) ✓ Task 3
- Pagine ricettario (lista + scheda) ✓ Task 4
- Pagine storie (lista + scheda) ✓ Task 5
- Pagine itinerari (lista + scheda sotto territorio) ✓ Task 6
- Helper di selezione condivisi con TDD ✓ Task 2
- Fix warning rotta ✓ Task 1

**Fuori scope (rimandato a sotto-piani successivi):**
- Mappe Leaflet sugli eventi e itinerari → 03
- Directory `places` (ristoranti, B&B) sotto territorio → 03
- Bacheca `notices` (lista + scheda) → 03
- Form iscrizione, volontari, tessera, segnalazioni, press request → 04 (richiede DB+email)
- Pagine statiche partecipa/chi-siamo/contatti → 03
- Traduzioni EN delle entry → trasversale, on demand
- Filtri stagionali nel ricettario, paginazione → quando i contenuti cresceranno

**Placeholder scan:** nessuno. Ogni step contiene il file completo.

**Type consistency:** `entry.slug.split('/')` per ricavare lang+slug coerente in tutti i `getStaticPaths` di dettaglio. `byLang` usa `slug.startsWith('${lang}/')` allineato al pattern.

**Rischi noti:**
- Le card linkano a slug che derivano dal nome del file MDX. Lo slug Astro per `events/it/2026-05-10-camminata-golena.mdx` è `it/2026-05-10-camminata-golena`: i `replace(/^(it|en)\//, '')` lo riducono correttamente.
- Le entry EN non esistono ancora: per ora le pagine `/en/...` mostreranno liste vuote — è atteso e si popolerà via traduzione manuale.

---

## Stato

Sotto-piano 02 pronto per esecuzione subagent-driven.
