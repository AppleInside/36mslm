# Design: Form "Segnala un evento"

**Date:** 2026-05-07

## Obiettivo

Quando l'utente clicca "Segnala un evento" nell'hub eventi, deve arrivare su un form dedicato che, all'invio, inserisce la segnalazione nella tabella `reports`.

## Campi del form

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| nome | text | sì | Solo nome, non cognome |
| email | email | sì | |
| titolo evento | text | sì | Salvato come `subject` in `reports` |
| descrizione | textarea | sì | Salvato come `body` in `reports` |
| lang | hidden | — | `it` o `en` |
| subject_type | hidden | — | Fisso: `"Proposta evento"` / `"Event proposal"` — **non usato**, il titolo evento va direttamente in `subject` |

> Il campo `subject` della tabella `reports` conterrà il titolo dell'evento proposto, così nella vista management è immediatamente leggibile.

## Architettura

### File nuovi
- `src/pages/[lang]/eventi/segnala.astro` — pagina pubblica bilingue (it/en), layout `Base`, stesso stile di `src/pages/[lang]/partecipa/segnalazioni.astro`.

### File modificati
- `src/pages/[lang]/eventi/index.astro:49` — link "Segnala un evento" cambiato da `localizedPath(lang, 'contatti')` a `localizedPath(lang, 'eventi/segnala')`.

### API riutilizzata
- `POST /api/report` — endpoint esistente, nessuna modifica. Accetta: `lang`, `name`, `email`, `subject`, `body`. Inserisce in tabella `reports`.

## Flusso utente

1. Utente clicca "Segnala un evento" nell'hub eventi (`/it/eventi`)
2. Arriva su `/it/eventi/segnala` (o `/en/eventi/segnala`)
3. Compila nome, email, titolo evento, descrizione
4. POST a `/api/report` — `subject` = titolo evento, `body` = descrizione
5. Redirect a `?ok=1` → messaggio di conferma, form nascosto
6. In caso di errore → redirect a `?err=1` → messaggio di errore

## Localizzazione

La pagina è bilingue. `getStaticPaths` esporta `it` ed `en`. Tutte le label e i messaggi hanno le due varianti inline (pattern già usato nel progetto).

## Validazione

Stessa validazione Zod dell'endpoint esistente:
- `name`: stringa 1–120 char
- `email`: email valida, max 200 char
- `subject` (titolo evento): stringa 1–200 char
- `body` (descrizione): stringa 5–5000 char
