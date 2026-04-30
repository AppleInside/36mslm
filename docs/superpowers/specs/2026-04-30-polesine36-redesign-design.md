# Polesine Parmense 36 m s.l.m. — Redesign

**Data:** 2026-04-30
**Stato:** Design approvato, in attesa di piano di implementazione
**Sito attuale:** https://www.polesineparmense36.it/
**Sviluppo:** locale (Node.js); deploy da decidere a fine MVP
**Owner tecnico:** Alessandro (unica persona che gestisce contenuti via codice)

## Contesto e motivazione

L'Associazione di Promozione Sociale "36 m s.l.m." gestisce un sito che oggi funziona come archivio digitale: foto storiche, proverbi, soprannomi, ricette. Il contenuto è ricco ma **non operativo**: chi lo legge non può fare nulla con quelle informazioni, e l'associazione (che organizza eventi e promuove il territorio) non ha strumenti per portare avanti la sua missione attraverso il sito.

Il redesign trasforma il sito da "museo digitale" a **strumento operativo di promozione territoriale**, mantenendo il patrimonio culturale ma riconvertendolo in contenuto editoriale al servizio di un pubblico vivo.

## Pubblico

Due audience principali, equilibrate:

- **Locali e potenziali soci** — sapere cosa fa l'associazione, partecipare a eventi, tesserarsi, contribuire come volontari, leggere la bacheca.
- **Turisti** (italiani e stranieri) — scoprire Polesine, capire dove andare, cosa mangiare, quali eventi pubblici sono in calendario.

Il sito non si rivolge primariamente a "polesinesi nel mondo" o nostalgici: il patrimonio della memoria è presente ma come **contenuto editoriale**, non come scopo principale.

## Principi guida

1. **Utilità prima di nostalgia.** Ogni sezione deve servire a qualcosa di concreto: iscriversi, andare, mangiare, partecipare, contattare.
2. **Una persona tecnica gestisce.** Niente CMS complesso, niente admin per non-tecnici. I contenuti vivono in MDX nel repo.
3. **YAGNI.** Niente pagamenti online, newsletter, analytics, login utente — si aggiungono solo quando una vera esigenza lo richiede.
4. **Bilinguismo IT/EN graduale.** IT è la lingua primaria; EN si traduce file per file con calma.
5. **Tutela diritti foto by default.** Watermark automatico, mai upload "pulito" pubblico.

## Architettura informativa

Menu principale (5 voci):

```
Eventi   ←  pilastro del sito
Scopri
  ├── Territorio        (itinerari, mangiare & dormire, come arrivare)
  ├── Ricettario        (ricette tradizionali con tag stagionali)
  └── Storie & memoria  (rubriche editoriali: foto storiche, dialetto, personaggi)
Partecipa
  ├── Tessera           (info, modulo richiesta, no pagamento online)
  ├── 5×1000            (codice fiscale, istruzioni)
  ├── Volontari         (form: vorrei dare una mano a un evento)
  ├── Bacheca           (assemblee, comunicazioni, bandi)
  └── Segnalazioni      (proponi un evento, segnala una storia, condividi una foto)
Chi siamo
  ├── Storia
  ├── Statuto
  ├── Trasparenza       (organi sociali, bilanci — obbligo APS)
  └── Press kit         (watermarked preview pubblica + form alta-res per stampa)
Contatti
```

Footer: link rapido "Sei della stampa? → Press kit", contatti, sede, codice fiscale, statuto/trasparenza.

### Home

Hero con **prossimo evento in evidenza** (CTA: Iscriviti / Tutti gli eventi).
Sotto: 3 card "Prossimi appuntamenti", riga "Scopri" (3 mini-card: Territorio / Ricettario / Storie), riga "Partecipa" (Tessera + Volontari).
Footer con contatti, sede, codice fiscale, link press kit, link statuto/trasparenza.

## Funzionalità per area

| Area | Funzioni |
|---|---|
| Eventi | Calendario, scheda evento (data, luogo, mappa Leaflet, descrizione, foto), form iscrizione → email all'admin |
| Territorio | Itinerari con mappa Leaflet + tracciato + PDF/GPX scaricabile; directory ristoranti/agriturismi/B&B con scheda, foto, contatti |
| Ricettario | Lista filtrabile per stagione/tipo, scheda ricetta (ingredienti, procedimento, foto, eventuale audio del nome dialettale) |
| Storie & memoria | Rubrica editoriale: post con copertina, testo, galleria foto, tag (Guareschi, dialetto, mestieri, foto storiche) |
| Tessera | Pagina informativa + form richiesta tessera → email all'admin |
| Volontari | Form "vorrei dare una mano" con scelta evento o area di interesse → email all'admin |
| Bacheca | Lista avvisi cronologica, scheda avviso (titolo, data, testo, allegati PDF) |
| Segnalazioni | Form aperto: proponi evento, segnala storia, condividi foto (con consenso uso e attribuzione) |
| Press kit | Galleria pubblica con foto watermarkate; form richiesta alta-res (testata, motivo, email) → email all'admin → admin invia link temporaneo |
| Trasparenza | Pagine statiche con statuto PDF, bilanci PDF, organi sociali |

## Identità visiva

**Palette "Pioppi & fiume":**

| Ruolo | Token | Hex |
|---|---|---|
| Verde primario (CTA, link) | `pioppo` | `#A8B89B` |
| Verde tenue (sfondi, badge) | `argento` | `#C9D4BD` |
| Azzurro accenti | `po` | `#9BAFB5` |
| Azzurro tenue (hover, sfondi freschi) | `acqua` | `#C5D3D7` |
| Sfondo pagina (caldo) | `sabbia` | `#F2EDE0` |
| Testo principale | `testo` | `#2C3530` |

**Tipografia:**
- Titoli: **Caveat** (handwritten, calda, comunitaria)
- Corpo: **Inter** (sans-serif, massima leggibilità anche su mobile)

**Logo:** placeholder testuale "36 m s.l.m." in attesa del logo definitivo dell'associazione. Lo stemma comunale **non** viene usato (è del Comune, non dell'associazione — eviterebbe confusione istituzionale).

## Architettura tecnica

| Strato | Tecnologia | Note |
|---|---|---|
| Framework | **Astro** + TypeScript | i18n nativo, ottimo SEO, isole interattive solo dove servono |
| Contenuti statici | **MDX** in `src/content/` | Eventi, ricette, itinerari, storie, bacheca, press-kit |
| Styling | **Tailwind CSS** | Token palette/font in `tailwind.config` |
| Database | **Postgres locale** (docker-compose) | Solo dati runtime: form submissions, press requests, photo metadata |
| Email | **Resend** | Conferme iscrizione, notifiche admin, link temporanei alta-res |
| Storage foto | **Filesystem locale** (`./storage/{original,web}/`) | `original/` privato (gitignored), `web/` servito come asset |
| Image processing | **sharp.js** | Watermark, resize multi-formato, EXIF |
| Mappe | **Leaflet** + tile **OpenStreetMap** | Itinerari, eventi, ristoranti |
| Auth admin | **Magic link via Resend** | Solo per `/admin/*` (upload foto, vedere richieste press, gestire bacheca veloce) |
| Deploy | da decidere | Opzioni: VPS con Node + nginx, oppure host managed (Vercel/Netlify SSR + DB esterno) — decisione rimandata a fine MVP |

**Struttura cartelle (proposta):**

```
src/
├── content/
│   ├── events/{it,en}/
│   ├── recipes/{it,en}/
│   ├── itineraries/{it,en}/
│   ├── stories/{it,en}/
│   ├── notices/{it,en}/      (bacheca)
│   └── places/{it,en}/       (ristoranti, B&B)
├── pages/
│   ├── [lang]/index.astro
│   ├── [lang]/eventi/...
│   ├── [lang]/scopri/...
│   ├── [lang]/partecipa/...
│   ├── [lang]/chi-siamo/...
│   ├── api/
│   │   ├── event-signup.ts
│   │   ├── volunteer.ts
│   │   ├── tessera.ts
│   │   ├── press-request.ts
│   │   ├── report.ts
│   │   └── upload-photo.ts   (admin only)
│   └── admin/...
└── components/
```

## Diritti foto (sezione dedicata)

Strategia **A+B combinata** (decisa in sede di brainstorming):

1. **Upload (solo admin)** → server-side `sharp.js`:
   - Genera versione web watermarkata (logo "© 36 m s.l.m." in basso a destra, opacità 60%)
   - Genera versioni multiple (thumbnail, small, medium, large) tutte watermarkate
   - Estrae EXIF e li salva in DB (`photos.metadata` jsonb)
   - Salva l'**originale pulito** in bucket privato `photos-original`
   - Salva le versioni web watermarkate in bucket pubblico `photos-web`
2. **Visualizzazione pubblica** → solo bucket `photos-web` (watermarkate)
3. **Press kit pubblico** → galleria di foto watermarkate, ognuna con bottone "Richiedi alta risoluzione"
4. **Form richiesta alta-res** → testata + uso + email + foto richieste → email admin con link
5. **Admin approva** → genera link temporaneo (token, scadenza 7 giorni) all'originale pulito
6. **Stampa scarica** → log download in DB

EXIF inclusi: `Copyright = "© Associazione 36 m s.l.m."`, `Artist = <autore>`, `Source = polesineparmense36.it`.

## Bilinguismo IT/EN

- Routing: `/it/...` (default), `/en/...`
- Astro i18n con fallback automatico: se la pagina EN non esiste, redirect alla IT
- Selettore lingua in header
- Nessuna auto-translation: ogni MDX ha un gemello in `/en/` solo se tradotto manualmente
- Inizio: tutti i contenuti in IT, EN vuoto. Si traduce gradualmente

## Migrazione contenuti

Quattro fasi:

1. **Scraper Node.js** del sito attuale → `legacy/pages/*.md` + `legacy/images/<sezione>/` + `legacy/inventory.json`
2. **Curation manuale** — l'owner marca per ogni voce: TIENI / RIVEDI / SCARTA
3. **Conversione MDX strutturato** con frontmatter (titolo, data, lingua, tag, copertina)
4. **Processing foto** via script: rinomina con slug, genera versioni multi-formato + watermark, carica su Object Storage, popola DB

**Alta risoluzione:** per le foto importanti, l'owner ha accesso al hosting attuale e recupera gli originali in fase 4 (non bloccante per il primo deploy).

## Cosa NON facciamo (YAGNI)

- Pagamenti online (Stripe/PayPal): tessera e iscrizioni passano da bonifico/contanti come oggi
- Newsletter: rimandata a quando ci sarà una vera necessità
- Analytics: rimandata
- Sistema login utenti pubblico: non serve per 5-10 eventi/anno
- CMS visuale: MDX nel repo è sufficiente per la scala attuale
- Auto-translation: traduzioni manuali, qualità garantita
- App mobile native: il sito mobile-first è sufficiente

## Domande aperte / decisioni rimandate

- **Logo definitivo dell'associazione**: in arrivo, fino ad allora placeholder testuale
- **Newsletter, analytics, payments**: rimandati esplicitamente
- **EN traduzioni**: graduali, owner-driven
- **Plausible Analytics**: valutare a 6 mesi dal lancio
- **Auto-renewal tessera**: non in scope (no pagamenti)

## Criteri di successo

Il redesign è considerato riuscito se, a 3 mesi dal lancio:
- Almeno 3 eventi sono stati pubblicati e hanno generato iscrizioni via form
- Almeno 1 richiesta press kit è arrivata
- L'admin riesce a pubblicare un nuovo evento (MDX + foto watermarkata) in <30 minuti
- Il sito carica in <2 secondi su mobile 3G
- Lighthouse: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 95

---

## Stato

**Design approvato.** Prossimo step: creazione piano di implementazione tramite skill `writing-plans`.
