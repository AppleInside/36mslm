# Sotto-piano 03 — Bacheca, Luoghi, pagine statiche

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coprire le sezioni rimanenti del menu: Bacheca (`notices`), directory dei luoghi (`places`) sotto Territorio, e tutte le pagine statiche di Partecipa, Chi siamo, Contatti.

**Architettura:** Stesso pattern delle dinamiche per `notices` e `places` (index + dettaglio con `byLang` + `sortByDateDesc`). Le pagine statiche sono file `.astro` per lingua-specifica condizionale (`lang === 'it' ? ... : ...`) — pragmatico finché l'EN è graduale. Form dei moduli rimandati al sotto-piano 04 (richiede DB+email): per ora ogni CTA «contatta» punta a un `mailto:`.

**Tech Stack:** Astro 5 content collections, Tailwind, i18n.

**Fuori scope:** form interattivi, mappe Leaflet, gestione PDF reale (link statici a documenti placeholder), DB, email.

---

## Task 1 — Bacheca (`notices`)

**Files:** `src/pages/[lang]/partecipa/bacheca/index.astro`, `src/pages/[lang]/partecipa/bacheca/[...slug].astro`, `src/components/NoticeCard.astro`

- [ ] **Step 1: Crea `src/components/NoticeCard.astro`**

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
import { formatEventDate } from '../lib/dates';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `partecipa/bacheca/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{formatEventDate(entry.data.date, lang)}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
</a>
```

- [ ] **Step 2: Crea `src/pages/[lang]/partecipa/bacheca/index.astro`**

```astro
---
import Base from '../../../../layouts/Base.astro';
import NoticeCard from '../../../../components/NoticeCard.astro';
import { getCollection } from 'astro:content';
import { byLang, sortByDateDesc } from '../../../../lib/content';
import type { Lang } from '../../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const all = await getCollection('notices');
const notices = sortByDateDesc(byLang(all, lang));
const title = lang === 'it' ? 'Bacheca' : 'Notice board';
const intro = lang === 'it'
  ? 'Avvisi, comunicazioni e bandi dell\'associazione.'
  : 'Notices, announcements and calls from the association.';
---
<Base title={title}>
  <h1 class="text-5xl">{title}</h1>
  <p class="mt-3 max-w-prose opacity-80">{intro}</p>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{notices.map((e) => <NoticeCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: Crea `src/pages/[lang]/partecipa/bacheca/[...slug].astro`**

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
    <div class="prose mt-8"><Content /></div>
    {entry.data.attachments.length > 0 && (
      <ul class="mt-8 space-y-1 text-sm">
        {entry.data.attachments.map((a) => <li><a href={a.url}>{a.label}</a></li>)}
      </ul>
    )}
  </article>
</Base>
```

- [ ] **Step 4: Build OK**

Run: `npm run build`
Expected: `dist/client/it/partecipa/bacheca/index.html` e `dist/client/it/partecipa/bacheca/2026-04-15-assemblea/index.html` esistono.

- [ ] **Step 5: Commit (path espliciti)**

```bash
git add "src/components/NoticeCard.astro" "src/pages/[lang]/partecipa/bacheca/"
git commit -m "feat(notices): bacheca list and detail pages"
```

---

## Task 2 — Luoghi (`places`) sotto Territorio

**Files:** `src/pages/[lang]/scopri/territorio/dove/index.astro`, `src/pages/[lang]/scopri/territorio/dove/[...slug].astro`, `src/components/PlaceCard.astro`. Aggiorna `src/pages/[lang]/scopri/territorio/index.astro` per linkare anche alla nuova directory.

- [ ] **Step 1: Crea `src/components/PlaceCard.astro`**

```astro
---
import { getLangFromUrl, localizedPath } from '../i18n/utils';
const { entry } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const slug = entry.slug.replace(/^(it|en)\//, '');
---
<a href={localizedPath(lang, `scopri/territorio/dove/${slug}`)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
  <p class="text-xs uppercase tracking-wider text-po">{entry.data.kind}</p>
  <h3 class="mt-1 text-2xl">{entry.data.title}</h3>
  <p class="mt-1 text-sm opacity-80">{entry.data.address}</p>
</a>
```

- [ ] **Step 2: Crea `src/pages/[lang]/scopri/territorio/dove/index.astro`**

```astro
---
import Base from '../../../../../layouts/Base.astro';
import PlaceCard from '../../../../../components/PlaceCard.astro';
import { getCollection } from 'astro:content';
import { byLang, sortByDateDesc } from '../../../../../lib/content';
import type { Lang } from '../../../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const all = await getCollection('places');
const places = sortByDateDesc(byLang(all, lang));
const title = lang === 'it' ? 'Dove mangiare e dormire' : 'Where to eat & stay';
---
<Base title={title}>
  <h1 class="text-5xl">{title}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">{places.map((e) => <PlaceCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 3: Crea `src/pages/[lang]/scopri/territorio/dove/[...slug].astro`**

```astro
---
import Base from '../../../../../layouts/Base.astro';
import { getCollection } from 'astro:content';
import type { Lang } from '../../../../../i18n/ui';

export async function getStaticPaths() {
  const all = await getCollection('places');
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
    <p class="text-xs uppercase tracking-wider text-po">{entry.data.kind}</p>
    <h1 class="mt-2 text-5xl">{entry.data.title}</h1>
    <p class="mt-2 opacity-80">{entry.data.address}</p>
    <div class="prose mt-8"><Content /></div>
    <ul class="mt-8 space-y-1 text-sm">
      {entry.data.phone && <li>Tel: <a href={`tel:${entry.data.phone}`}>{entry.data.phone}</a></li>}
      {entry.data.website && <li>Web: <a href={entry.data.website}>{entry.data.website}</a></li>}
    </ul>
  </article>
</Base>
```

- [ ] **Step 4: Aggiorna `src/pages/[lang]/scopri/territorio/index.astro`** aggiungendo un link verso `dove/` sopra alla griglia degli itinerari.

Sostituisci il blocco JSX (mantenendo gli import + frontmatter) con:

```astro
<Base title={t('nav.discover.territory')}>
  <h1 class="text-5xl">{t('nav.discover.territory')}</h1>
  <p class="mt-3 max-w-prose opacity-80">Itinerari a piedi e in bicicletta tra il Po e i pioppi.</p>

  <div class="mt-6">
    <a href={`/${lang}/scopri/territorio/dove/`} class="inline-block rounded-full border border-pioppo px-5 py-2 no-underline">
      {lang === 'it' ? 'Dove mangiare e dormire →' : 'Where to eat & stay →'}
    </a>
  </div>

  <div class="mt-8 grid gap-4 md:grid-cols-2">{itineraries.map((e) => <ItineraryCard entry={e} />)}</div>
</Base>
```

- [ ] **Step 5: Build OK**

Run: `npm run build`
Expected: `dist/client/it/scopri/territorio/dove/index.html` e `dist/client/it/scopri/territorio/dove/trattoria-al-cavallino/index.html` esistono.

- [ ] **Step 6: Commit (path espliciti)**

```bash
git add "src/components/PlaceCard.astro" "src/pages/[lang]/scopri/territorio/"
git commit -m "feat(places): directory dove mangiare e dormire under territorio"
```

---

## Task 3 — Partecipa (landing + 4 pagine info)

**Files:** `src/pages/[lang]/partecipa/index.astro`, `src/pages/[lang]/partecipa/tessera.astro`, `src/pages/[lang]/partecipa/5x1000.astro`, `src/pages/[lang]/partecipa/volontari.astro`, `src/pages/[lang]/partecipa/segnalazioni.astro`

Tutte queste pagine sono informative finché non ci sono i form: le CTA puntano a `mailto:info@polesineparmense36.it` con un subject precompilato.

- [ ] **Step 1: `src/pages/[lang]/partecipa/index.astro`** (landing con 5 card)

```astro
---
import Base from '../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);

const cards = lang === 'it'
  ? [
    { href: 'partecipa/tessera', title: 'Tessera', body: 'Diventa socio per sostenere l\'associazione.' },
    { href: 'partecipa/5x1000', title: '5×1000', body: 'Destinaci il tuo 5×1000.' },
    { href: 'partecipa/volontari', title: 'Volontari', body: 'Dai una mano a un evento.' },
    { href: 'partecipa/bacheca', title: 'Bacheca', body: 'Avvisi e comunicazioni.' },
    { href: 'partecipa/segnalazioni', title: 'Segnalazioni', body: 'Proponi un evento o una storia.' },
  ]
  : [
    { href: 'partecipa/tessera', title: 'Membership', body: 'Become a member.' },
    { href: 'partecipa/5x1000', title: '5×1000', body: 'Donate your 5×1000.' },
    { href: 'partecipa/volontari', title: 'Volunteers', body: 'Help out at an event.' },
    { href: 'partecipa/bacheca', title: 'Notice board', body: 'Notices and announcements.' },
    { href: 'partecipa/segnalazioni', title: 'Reports', body: 'Suggest an event or story.' },
  ];
---
<Base title={t('nav.participate')}>
  <h1 class="text-5xl">{t('nav.participate')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {cards.map((c) => (
      <a href={localizedPath(lang, c.href)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
        <h2 class="text-2xl">{c.title}</h2>
        <p class="mt-1 text-sm opacity-80">{c.body}</p>
      </a>
    ))}
  </div>
</Base>
```

- [ ] **Step 2: `src/pages/[lang]/partecipa/tessera.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Tessera' : 'Membership';
const subject = encodeURIComponent(lang === 'it' ? 'Richiesta tessera' : 'Membership request');
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>La tessera annuale sostiene le attività dell'Associazione di Promozione Sociale «36 m s.l.m.»: organizzazione eventi, manutenzione del sito, promozione del territorio.</p>
        <h2>Come tesserarsi</h2>
        <ol>
          <li>Scrivi a <a href={`mailto:${SITE.email}?subject=${subject}`}>{SITE.email}</a> indicando nome, cognome e codice fiscale.</li>
          <li>Riceverai le coordinate per il bonifico della quota associativa.</li>
          <li>A pagamento ricevuto ti viene rilasciata la tessera.</li>
        </ol>
        <p>Quota e modalità sono pubblicate ogni anno in <a href="bacheca/">Bacheca</a>.</p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>The annual membership supports the activities of the «36 m s.l.m.» social promotion association: events, the website, territorial promotion.</p>
        <h2>How to join</h2>
        <ol>
          <li>Write to <a href={`mailto:${SITE.email}?subject=${subject}`}>{SITE.email}</a> with your full name and tax code.</li>
          <li>You will receive bank-transfer details.</li>
          <li>Once payment is received, your membership card is issued.</li>
        </ol>
        <p>Annual fee and terms are posted each year on the <a href="bacheca/">Notice board</a>.</p>
      </div>
    )}
    <a href={`mailto:${SITE.email}?subject=${subject}`} class="mt-10 inline-block rounded-full bg-pioppo px-5 py-2 text-white no-underline">
      {lang === 'it' ? 'Scrivi per la tessera' : 'Email to join'}
    </a>
  </article>
</Base>
```

- [ ] **Step 3: `src/pages/[lang]/partecipa/5x1000.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = '5×1000';
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>Destina il tuo 5×1000 all'Associazione di Promozione Sociale <strong>36 m s.l.m.</strong>: non ti costa nulla e per noi è un sostegno importante.</p>
        <p>Nella dichiarazione dei redditi, nel riquadro «Sostegno del volontariato e delle altre organizzazioni non lucrative», firma e indica il codice fiscale:</p>
        <p class="font-hand text-3xl">{SITE.codiceFiscale}</p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>You can donate your Italian 5×1000 to <strong>36 m s.l.m.</strong>: it costs you nothing and helps us a lot.</p>
        <p>On your tax return, in the «Sostegno del volontariato» box, sign and write the tax code:</p>
        <p class="font-hand text-3xl">{SITE.codiceFiscale}</p>
      </div>
    )}
  </article>
</Base>
```

- [ ] **Step 4: `src/pages/[lang]/partecipa/volontari.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Volontari' : 'Volunteers';
const subject = encodeURIComponent(lang === 'it' ? 'Vorrei dare una mano' : 'I would like to help out');
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>Gli eventi di Polesine 36 si reggono sul lavoro dei volontari. Bastano poche ore in una giornata: accoglienza, allestimento, cucina, foto, accompagnamento sui sentieri.</p>
        <p>Scrivici dicendoci chi sei, in quale evento vorresti aiutare e cosa ti viene meglio fare. Ti rispondiamo entro qualche giorno.</p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>Polesine 36 events run thanks to volunteers. Even just a few hours help: welcoming, set-up, kitchen, photos, trail guiding.</p>
        <p>Write to us — tell us who you are, which event you would join, and what you do best. We reply within a few days.</p>
      </div>
    )}
    <a href={`mailto:${SITE.email}?subject=${subject}`} class="mt-10 inline-block rounded-full bg-pioppo px-5 py-2 text-white no-underline">
      {lang === 'it' ? 'Scrivi per fare il volontario' : 'Email to volunteer'}
    </a>
  </article>
</Base>
```

- [ ] **Step 5: `src/pages/[lang]/partecipa/segnalazioni.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Segnalazioni' : 'Reports';
const subject = encodeURIComponent(lang === 'it' ? 'Segnalazione' : 'Report');
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>Hai un evento da proporre, una storia da raccontare o una foto storica da condividere?</p>
        <ul>
          <li><strong>Proponi un evento</strong>: ci vuole il titolo, una data ipotetica, il luogo e due righe.</li>
          <li><strong>Segnala una storia</strong>: titolo, fonte e perché vale la pena raccontarla.</li>
          <li><strong>Condividi una foto</strong>: indica autore, anno e un consenso esplicito alla pubblicazione con attribuzione.</li>
        </ul>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>Got an event to suggest, a story to tell, or a historic photo to share? Drop us a line.</p>
      </div>
    )}
    <a href={`mailto:${SITE.email}?subject=${subject}`} class="mt-10 inline-block rounded-full bg-pioppo px-5 py-2 text-white no-underline">
      {lang === 'it' ? 'Scrivi una segnalazione' : 'Send a report'}
    </a>
  </article>
</Base>
```

- [ ] **Step 6: Build OK**

Run: `npm run build`
Expected: `dist/client/it/partecipa/index.html`, `.../tessera/index.html`, `.../5x1000/index.html`, `.../volontari/index.html`, `.../segnalazioni/index.html` esistono.

- [ ] **Step 7: Commit (path espliciti)**

```bash
git add "src/pages/[lang]/partecipa/"
git commit -m "feat(participate): landing + tessera + 5x1000 + volontari + segnalazioni"
```

---

## Task 4 — Chi siamo (landing + storia + statuto/trasparenza + press kit)

**Files:** `src/pages/[lang]/chi-siamo/index.astro`, `chi-siamo/storia.astro`, `chi-siamo/statuto.astro`, `chi-siamo/trasparenza.astro`, `chi-siamo/press-kit.astro`

PDF reali (statuto, bilanci) sono rimandati: per ora stub «documento in arrivo».

- [ ] **Step 1: `src/pages/[lang]/chi-siamo/index.astro`** (landing con 4 card)

```astro
---
import Base from '../../../layouts/Base.astro';
import { useTranslations, localizedPath } from '../../../i18n/utils';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);

const cards = lang === 'it'
  ? [
    { href: 'chi-siamo/storia', title: 'Storia', body: 'Da dove veniamo, perché esistiamo.' },
    { href: 'chi-siamo/statuto', title: 'Statuto', body: 'Atto costitutivo e regolamento.' },
    { href: 'chi-siamo/trasparenza', title: 'Trasparenza', body: 'Organi sociali, bilanci, obblighi APS.' },
    { href: 'chi-siamo/press-kit', title: 'Press kit', body: 'Foto e materiali per la stampa.' },
  ]
  : [
    { href: 'chi-siamo/storia', title: 'History', body: 'Who we are and why.' },
    { href: 'chi-siamo/statuto', title: 'Bylaws', body: 'Founding act and regulations.' },
    { href: 'chi-siamo/trasparenza', title: 'Transparency', body: 'Officers, balance sheets, APS duties.' },
    { href: 'chi-siamo/press-kit', title: 'Press kit', body: 'Photos and materials for press.' },
  ];
---
<Base title={t('nav.about')}>
  <h1 class="text-5xl">{t('nav.about')}</h1>
  <div class="mt-8 grid gap-4 md:grid-cols-2">
    {cards.map((c) => (
      <a href={localizedPath(lang, c.href)} class="block rounded-2xl border border-argento bg-sabbia p-5 no-underline transition hover:bg-argento/40">
        <h2 class="text-2xl">{c.title}</h2>
        <p class="mt-1 text-sm opacity-80">{c.body}</p>
      </a>
    ))}
  </div>
</Base>
```

- [ ] **Step 2: `src/pages/[lang]/chi-siamo/storia.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Storia' : 'History';
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>«36 m s.l.m.» è la quota di Polesine Parmense, paese di pianura tra Po e pioppi. Nasce come Associazione di Promozione Sociale per tenere viva la memoria del territorio e per promuovere chi lo abita oggi.</p>
        <p>Lavoriamo per due tipi di pubblico: i polesinesi che vogliono partecipare alle attività dell'associazione, e chi visita il paese per la prima volta — turisti, ciclisti, curiosi della cucina del Po.</p>
        <p>La sede è in paese, le riunioni sono aperte, i contatti sono nel <a href="../../contatti/">footer</a>.</p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>«36 m s.l.m.» is the elevation of Polesine Parmense, a riverbank village in the Po plain. We are a social-promotion association keeping the local memory alive and promoting the people who live here today.</p>
        <p>Two audiences: locals who want to take part, and visitors discovering the village for the first time.</p>
      </div>
    )}
  </article>
</Base>
```

- [ ] **Step 3: `src/pages/[lang]/chi-siamo/statuto.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Statuto' : 'Bylaws';
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>L'atto costitutivo e lo statuto dell'associazione sono depositati e disponibili in formato PDF.</p>
        <p class="opacity-70"><em>Il documento PDF sarà collegato qui non appena la digitalizzazione sarà completata.</em></p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>Founding act and bylaws are deposited and available in PDF.</p>
        <p class="opacity-70"><em>The PDF document will be linked here as soon as digitization is complete.</em></p>
      </div>
    )}
  </article>
</Base>
```

- [ ] **Step 4: `src/pages/[lang]/chi-siamo/trasparenza.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = lang === 'it' ? 'Trasparenza' : 'Transparency';
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <h2>Identità</h2>
        <ul>
          <li>Denominazione: {SITE.longName}</li>
          <li>Sede: {SITE.address}</li>
          <li>Codice fiscale: {SITE.codiceFiscale}</li>
        </ul>
        <h2>Organi sociali</h2>
        <p class="opacity-70"><em>Composizione del consiglio direttivo e delle altre cariche aggiornata dopo ogni assemblea — sezione in arrivo.</em></p>
        <h2>Bilanci</h2>
        <p class="opacity-70"><em>I bilanci di esercizio (obbligo APS) saranno pubblicati qui in formato PDF.</em></p>
      </div>
    ) : (
      <div class="prose mt-8">
        <h2>Identity</h2>
        <ul>
          <li>Legal name: {SITE.longName}</li>
          <li>Address: {SITE.address}</li>
          <li>Tax code: {SITE.codiceFiscale}</li>
        </ul>
        <h2>Officers</h2>
        <p class="opacity-70"><em>Board composition is updated after each general meeting — section coming.</em></p>
        <h2>Balance sheets</h2>
        <p class="opacity-70"><em>Annual balance sheets (APS duty) will be posted here as PDF.</em></p>
      </div>
    )}
  </article>
</Base>
```

- [ ] **Step 5: `src/pages/[lang]/chi-siamo/press-kit.astro`**

```astro
---
import Base from '../../../layouts/Base.astro';
import { SITE } from '../../../consts';
import type { Lang } from '../../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const title = 'Press kit';
const subject = encodeURIComponent(lang === 'it' ? 'Richiesta foto alta risoluzione' : 'High-res photo request');
---
<Base title={title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{title}</h1>
    {lang === 'it' ? (
      <div class="prose mt-8">
        <p>Se sei della stampa o stai realizzando un articolo / un servizio su Polesine Parmense e ti servono <strong>foto in alta risoluzione</strong>, contattaci. Sul sito pubblichiamo solo versioni con watermark per tutelare gli autori.</p>
        <p>Nella richiesta indica: testata, autore, motivo dell'utilizzo e quali foto ti servono. Risponderemo con un link temporaneo agli originali.</p>
        <p class="opacity-70"><em>La galleria pubblica con watermark sarà collegata qui appena disponibile.</em></p>
      </div>
    ) : (
      <div class="prose mt-8">
        <p>Press? Need <strong>high-resolution photos</strong> for an article? Contact us. On the site we publish watermarked previews to protect authors.</p>
        <p>In your request include: outlet, author, intended use, and which photos you need. We reply with a temporary link to the originals.</p>
        <p class="opacity-70"><em>The public watermarked gallery will be linked here when ready.</em></p>
      </div>
    )}
    <a href={`mailto:${SITE.email}?subject=${subject}`} class="mt-10 inline-block rounded-full bg-pioppo px-5 py-2 text-white no-underline">
      {lang === 'it' ? 'Richiedi alta risoluzione' : 'Request high-res'}
    </a>
  </article>
</Base>
```

- [ ] **Step 6: Build OK**

Run: `npm run build`
Expected: `dist/client/it/chi-siamo/{index,storia,statuto,trasparenza,press-kit}/index.html` tutti presenti.

- [ ] **Step 7: Commit (path espliciti)**

```bash
git add "src/pages/[lang]/chi-siamo/"
git commit -m "feat(about): landing + storia + statuto + trasparenza + press kit"
```

---

## Task 5 — Contatti

**Files:** `src/pages/[lang]/contatti.astro`

- [ ] **Step 1: Crea `src/pages/[lang]/contatti.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import { SITE } from '../../consts';
import { useTranslations } from '../../i18n/utils';
import type { Lang } from '../../i18n/ui';

export function getStaticPaths() {
  return [{ params: { lang: 'it' } }, { params: { lang: 'en' } }];
}

const lang = Astro.params.lang as Lang;
const t = useTranslations(lang);
---
<Base title={t('nav.contact')}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{t('nav.contact')}</h1>
    <div class="prose mt-8">
      <p>{lang === 'it'
        ? 'Per qualsiasi domanda — eventi, tessera, foto, segnalazioni — scrivici. Rispondiamo nel giro di qualche giorno.'
        : 'Any question — events, membership, photos, reports — drop us a line. We reply within a few days.'}</p>
      <ul>
        <li>Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
        <li>{lang === 'it' ? 'Sede' : 'Office'}: {SITE.address}</li>
        <li>{lang === 'it' ? 'Codice fiscale' : 'Tax code'}: {SITE.codiceFiscale}</li>
      </ul>
    </div>
  </article>
</Base>
```

- [ ] **Step 2: Build + smoke + test**

Run: `npm test && npm run build`
Expected: 13/13 test PASS; build clean; tutte le pagine del menu generate sotto `/it/` e `/en/`.

- [ ] **Step 3: Commit (path espliciti)**

```bash
git add "src/pages/[lang]/contatti.astro"
git commit -m "feat(contact): contact page"
```

---

## Self-Review

**Spec coverage (questo sotto-piano):**
- Bacheca (`notices`) con lista cronologica + scheda + allegati ✓ Task 1
- Directory luoghi (`places`) sotto Territorio ✓ Task 2
- Partecipa: tessera, 5×1000, volontari, bacheca (già da T1), segnalazioni ✓ Task 3
- Chi siamo: storia, statuto, trasparenza, press kit ✓ Task 4
- Contatti ✓ Task 5
- Footer link a press kit ora valido ✓

**Fuori scope (rimandato a sotto-piani successivi):**
- Form (iscrizione evento, volontari, tessera, press request, segnalazioni) → 04 (richiede DB+email)
- Mappa Leaflet → 04 o 05
- Auth admin + upload foto → 05
- Bilingue completo → graduale

**Placeholder scan:** ogni pagina ha contenuto IT pieno; gli stub `documento in arrivo` per statuto/trasparenza sono volontari (i PDF arrivano dall'owner).

**Type consistency:** `getStaticPaths` con `params.lang` consistente in tutte le pagine; `entry.slug.split('/')` invariato; `byLang`/`sortByDateDesc` riusati.

**Rischi noti:**
- I `mailto:` con subject precompilato funzionano nei client moderni; in alcuni mobile sgranano. Accettabile finché non mettiamo i form veri.
- Il selettore EN mostra pagine con stub minimi: chi visita `/en/...` vede l'inglese o il fallback IT — coerente con la promessa del design «EN graduale».

---

## Stato

Sotto-piano 03 pronto per esecuzione subagent-driven.
