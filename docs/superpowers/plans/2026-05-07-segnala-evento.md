# Segnala Evento Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere una pagina `/[lang]/eventi/segnala` con form dedicato per proposta evento che inserisce nella tabella `reports`, e aggiornare il link nell'hub eventi.

**Architecture:** Nuova pagina Astro bilingue (it/en) che riusa l'endpoint `/api/report` già esistente. Il titolo dell'evento va nel campo `subject` della tabella `reports`; la descrizione va in `body`. Nessuna modifica al backend.

**Tech Stack:** Astro 5, Tailwind CSS, endpoint esistente `/api/report` (Zod + postgres)

---

## File Map

| Azione | File |
|--------|------|
| Crea | `src/pages/[lang]/eventi/segnala.astro` |
| Modifica | `src/pages/[lang]/eventi/index.astro` (riga 49) |

---

### Task 1: Crea la pagina `segnala.astro`

**Files:**
- Create: `src/pages/[lang]/eventi/segnala.astro`

> Questa è una pagina Astro (routing + template). Non ha logica di business isolabile — la verifica è manuale (Task 3).

- [ ] **Step 1: Crea il file `src/pages/[lang]/eventi/segnala.astro`**

```astro
---
export const prerender = false;
import Base from '../../../layouts/Base.astro';
import type { Lang } from '../../../i18n/ui';

const lang = Astro.params.lang as Lang;
const ok   = Astro.url.searchParams.get('ok');
const err  = Astro.url.searchParams.get('err');

const it = lang === 'it';

const t = {
  title:    it ? 'Proponi un evento' : 'Propose an event',
  intro:    it
    ? 'Hai un evento da proporre? Raccontacelo: ti risponderemo il prima possibile.'
    : 'Got an event to suggest? Tell us about it and we will get back to you.',
  name:     it ? 'Nome' : 'First name',
  email:    'Email',
  titleLbl: it ? "Titolo dell'evento" : 'Event title',
  body:     it ? 'Descrizione' : 'Description',
  bodyHint: it ? "Descrivi l'evento con il maggior dettaglio possibile." : 'Describe the event in as much detail as possible.',
  send:     it ? 'Invia proposta' : 'Send proposal',
  ok:       it ? 'Proposta ricevuta. Grazie!' : 'Proposal received. Thank you!',
  err:      it ? 'Qualcosa è andato storto. Riprova.' : 'Something went wrong. Please try again.',
};
---

<Base title={t.title}>
  <article class="mx-auto max-w-prose">
    <h1 class="text-5xl">{t.title}</h1>

    <p class="mt-6 text-base text-testo/70 leading-relaxed">{t.intro}</p>

    {ok && (
      <div class="mt-6 flex items-center gap-2 rounded-lg border border-pioppo/30 bg-pioppo/10 px-4 py-3 text-sm text-pioppo">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {t.ok}
      </div>
    )}

    {err && (
      <div class="mt-6 flex items-center gap-2 rounded-lg border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-600">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.3"/>
          <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
        </svg>
        {t.err}
      </div>
    )}

    {!ok && (
      <form method="POST" action="/api/report" class="mt-8 grid gap-4">
        <input type="hidden" name="lang" value={lang} />

        <label class="grid gap-1 text-sm font-medium">
          <span>{t.name} <span class="text-red-400">*</span></span>
          <input
            name="name"
            type="text"
            required
            maxlength="120"
            autocomplete="given-name"
            class="rounded border border-argento bg-sabbia px-3 py-2 text-sm focus:border-pioppo focus:outline-none"
          />
        </label>

        <label class="grid gap-1 text-sm font-medium">
          <span>Email <span class="text-red-400">*</span></span>
          <input
            name="email"
            type="email"
            required
            maxlength="200"
            autocomplete="email"
            class="rounded border border-argento bg-sabbia px-3 py-2 text-sm focus:border-pioppo focus:outline-none"
          />
        </label>

        <label class="grid gap-1 text-sm font-medium">
          <span>{t.titleLbl} <span class="text-red-400">*</span></span>
          <input
            name="subject"
            type="text"
            required
            maxlength="200"
            class="rounded border border-argento bg-sabbia px-3 py-2 text-sm focus:border-pioppo focus:outline-none"
          />
        </label>

        <label class="grid gap-1 text-sm font-medium">
          <span>{t.body} <span class="text-red-400">*</span></span>
          <textarea
            name="body"
            required
            rows="6"
            maxlength="5000"
            class="rounded border border-argento bg-sabbia px-3 py-2 text-sm focus:border-pioppo focus:outline-none resize-y"
          ></textarea>
          <span class="text-xs text-testo/40">{t.bodyHint}</span>
        </label>

        <div class="mt-2">
          <button
            type="submit"
            class="inline-block rounded-full bg-pioppo px-6 py-2.5 text-sm text-white transition-colors hover:bg-pioppo/85"
          >
            {t.send}
          </button>
        </div>
      </form>
    )}
  </article>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add "src/pages/[lang]/eventi/segnala.astro"
git commit -m "feat: add segnala-evento form page"
```

---

### Task 2: Aggiorna il link nell'hub eventi

**Files:**
- Modify: `src/pages/[lang]/eventi/index.astro:49`

- [ ] **Step 1: Cambia la destinazione del link "Segnala un evento"**

In `src/pages/[lang]/eventi/index.astro`, riga 49, sostituisci:

```astro
          <a href={localizedPath(lang, 'contatti')}>
```

con:

```astro
          <a href={localizedPath(lang, 'eventi/segnala')}>
```

- [ ] **Step 2: Commit**

```bash
git add "src/pages/[lang]/eventi/index.astro"
git commit -m "feat: link segnala-evento from eventi hub"
```

---

### Task 3: Verifica manuale

- [ ] **Step 1: Avvia il dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verifica il link nell'hub**

Apri `http://localhost:4321/it/eventi`. Clicca "Segnala un evento" → deve navigare a `/it/eventi/segnala`.

- [ ] **Step 3: Verifica la pagina in italiano**

Su `/it/eventi/segnala`:
- Titolo: "Proponi un evento"
- Campi visibili: Nome, Email, Titolo dell'evento, Descrizione
- Assente: cognome, data, luogo, menu a tendina tipo-segnalazione

- [ ] **Step 4: Verifica la pagina in inglese**

Apri `http://localhost:4321/en/eventi/segnala`:
- Titolo: "Propose an event"
- Label campi: First name, Email, Event title, Description

- [ ] **Step 5: Invia il form e verifica inserimento in `reports`**

Compila con dati validi (es. nome "Mario", email "mario@test.com", titolo "Sagra del Po", descrizione "Evento estivo...") e invia.

Risultato atteso:
1. Redirect a `/it/eventi/segnala?ok=1`
2. Banner verde "Proposta ricevuta. Grazie!"
3. In `/management/segnalazioni`: nuova card con subject = "Sagra del Po", body = "Evento estivo..."

- [ ] **Step 6: Verifica errore di validazione**

Invia il form con email non valida (es. `pippo`). Risultato atteso: redirect a `?err=1`, banner rosso "Qualcosa è andato storto. Riprova."
