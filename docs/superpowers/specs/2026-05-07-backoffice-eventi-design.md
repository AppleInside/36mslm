# Backoffice — Sezione Eventi

**Data:** 2026-05-07  
**Scope:** Autenticazione admin + CRUD eventi (solo lingua IT)

---

## 1. Accesso

- URL: `/management` (nessun link visibile sul sito pubblico)
- Login tramite email + password verificata contro la tabella `users` (campo `password_hash`, algoritmo bcrypt)
- Nessuna integrazione con Supabase Auth — auth completamente custom

---

## 2. Autenticazione & Sessioni

### Cookie di sessione

- Nome: `mgmt_session`
- Formato: `userId:expires:signature`
  - `userId`: intero (PK della tabella `users`)
  - `expires`: timestamp Unix in ms (now + 24h)
  - `signature`: HMAC-SHA256 su `userId:expires` con chiave `SESSION_SECRET`
- Attributi: `HttpOnly`, `SameSite=Strict`, `Secure` in produzione, `Path=/management`
- Durata: 24 ore

### Variabili d'ambiente richieste

```
SESSION_SECRET=<stringa casuale lunga almeno 32 caratteri>
```

### Flusso login

1. `GET /management` → pagina login (form email + password)
2. `POST /api/management/login`:
   - Cerca utente per email in `users`
   - Verifica password con `bcryptjs.compare()`
   - Aggiorna `last_login_at`
   - Imposta cookie `mgmt_session`
   - Redirect a `/management/eventi`
3. `POST /api/management/logout`:
   - Cancella cookie `mgmt_session`
   - Redirect a `/management`

### Middleware

File: `src/middleware.ts`

- Protegge tutte le route che iniziano con `/management/` (nota: con slash finale, quindi NON blocca `/management` stesso)
- Protegge anche `/api/management/eventi/*`
- Se cookie assente o non valido → redirect a `/management`
- Inietta `userId` in `Astro.locals` per uso nelle pagine protette

---

## 3. Layout Management

File: `src/layouts/Management.astro`

- Completamente separato da `Base.astro` (niente Header/Footer pubblici)
- Usa i colori del sito: topbar in `pioppo`, sidebar in `argento`
- Font: Fraunces (titoli), IBM Plex Mono (dati tecnici), Inter (corpo)

### Struttura

```
┌─────────────────────────────────────────────┐
│  36 m s.l.m. — Gestione    [Nome] [Esci]    │  ← topbar pioppo
├──────────────┬──────────────────────────────┤
│  • Eventi    │  <slot />                    │
│              │                              │
└──────────────┴──────────────────────────────┘
```

- Topbar: logo testuale, nome display utente loggato, pulsante "Esci" (POST /api/management/logout)
- Sidebar: voce "Eventi" attiva, espandibile in futuro per altre sezioni
- Responsive: su mobile la sidebar si nasconde, hamburger in topbar

### Props

```ts
interface Props {
  title: string;
  userId: number;
  userDisplayName: string;
}
```

---

## 4. Sezione Eventi

### 4.1 Lista eventi — `/management/eventi`

File: `src/pages/management/eventi/index.astro`

- Tabella con tutte le righe della tabella `events` dove `lang = 'it'`
- Colonne: **Titolo**, **Data**, **Luogo**, **Iscrizioni** (sì/no), **Stato** (badge colorato: draft=grigio, published=verde), **Azioni**
- Azioni per riga: [Modifica] → `/management/eventi/[id]` | [Elimina] → form POST nascosto con confirm JS
- Pulsante "Nuovo evento" in alto a destra → `/management/eventi/nuovo`
- Ordinamento: data DESC

### 4.2 Form evento (create & edit)

File create: `src/pages/management/eventi/nuovo.astro`  
File edit: `src/pages/management/eventi/[id].astro`

| Campo | Tipo HTML | Note |
|-------|-----------|------|
| Titolo | `<input type="text">` | required |
| Slug | `<input type="text">` | auto-generato dal titolo (JS client), modificabile manualmente |
| Data | `<input type="date">` | required |
| Ora inizio | `<input type="time">` | opzionale |
| Ora fine | `<input type="time">` | opzionale |
| Luogo | `<input type="text">` | opzionale |
| Descrizione | `<textarea>` + anteprima | Markdown, preview live via `marked` (CDN) |
| Immagine copertina | `<input type="file">` | Upload a Supabase Storage → salva URL in `cover_url` |
| Iscrizioni richieste | `<input type="checkbox">` | mappa su `signup_required` |
| Stato | `<select>` | opzioni: draft / published |

- `lang` fisso a `'it'`, non esposto nel form
- La pagina di modifica pre-popola tutti i campi con i dati esistenti

### 4.3 API endpoints e SSR

Tutte le pagine sotto `src/pages/management/` e tutti gli endpoint `src/pages/api/management/` devono avere `export const prerender = false` (richiesto da `output: 'static'` in astro.config.mjs — il middleware Vercel agisce solo sulle route SSR).

| Endpoint | Metodo | Azione |
|----------|--------|--------|
| `/api/management/login` | POST | Autentica, imposta cookie |
| `/api/management/logout` | POST | Cancella cookie |
| `/api/management/eventi/create` | POST | Inserisce riga in `events` |
| `/api/management/eventi/[id]/update` | POST | Aggiorna riga in `events` |
| `/api/management/eventi/[id]/delete` | POST | Elimina riga da `events` |

**Upload immagine:**  
La create/update riceve `multipart/form-data`. Se presente un file, lo carica su Supabase Storage (bucket `media`, path `eventi/<slug>.<ext>`) tramite fetch con `SUPABASE_SERVICE_KEY`, salva l'URL restituito in `cover_url`.

**Validazione (Zod):**
```ts
{
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  signup_required: z.boolean().default(false),
  status: z.enum(['draft', 'published']),
}
```

**Risposta:** redirect a `/management/eventi` con query param `?ok=1` (o `?err=1` in caso di errore). La lista mostra un banner di feedback.

### 4.4 Eliminazione

- Pulsante "Elimina" nella lista fa submit di un form `<form method="POST">` nascosto
- JS client mostra `confirm("Eliminare questo evento?")` prima del submit
- L'endpoint `/api/management/eventi/[id]/delete` verifica che l'evento esista, poi lo cancella

---

## 5. Dipendenze da aggiungere

| Pacchetto | Uso |
|-----------|-----|
| `bcryptjs` | Verifica password hash |
| `@types/bcryptjs` | Tipi TypeScript |
| `marked` | Render Markdown preview (lato client, CDN) |

---

## 6. File da creare/modificare

```
src/
├── middleware.ts                                  (nuovo)
├── lib/
│   └── auth.ts                                   (nuovo)
├── layouts/
│   └── Management.astro                          (nuovo)
└── pages/
    ├── management/
    │   ├── index.astro                            (nuovo — login)
    │   └── eventi/
    │       ├── index.astro                        (nuovo — lista)
    │       ├── nuovo.astro                        (nuovo — form create)
    │       └── [id].astro                         (nuovo — form edit)
    └── api/
        └── management/
            ├── login.ts                           (nuovo)
            ├── logout.ts                          (nuovo)
            └── eventi/
                ├── create.ts                      (nuovo)
                └── [id]/
                    ├── update.ts                  (nuovo)
                    └── delete.ts                  (nuovo)

.env                                               (aggiungere SESSION_SECRET)
```

---

## 7. Note di sicurezza

- Tutti gli endpoint `/api/management/*` (tranne login/logout) verificano il cookie di sessione indipendentemente dal middleware, come doppio controllo
- Slug eventi validato con regex `/^[a-z0-9-]+$/` per prevenire injection
- Upload immagini: validazione `mimetype` (solo `image/*`) e dimensione massima 5MB
- Il cookie `mgmt_session` ha `HttpOnly` → non accessibile da JavaScript
