# Sotto-piano 04 — DB, email, primo form E2E (event signup)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettere in piedi l'infrastruttura runtime (Postgres locale via docker-compose, client email via Resend, endpoint API SSR) e cablare il primo form end-to-end: iscrizione a un evento.

**Architettura:**
- Postgres in docker-compose, con migrazioni come file `.sql` montati nella init-dir del container (eseguiti al primo boot).
- Client DB: libreria `postgres` (postgres.js) con un wrapper sottile in `src/server/db.ts`.
- Client email: libreria `resend` con wrapper in `src/server/email.ts`.
- Endpoint API SSR: `src/pages/api/event-signup.ts` con `export const prerender = false`. Validazione payload via zod.
- Form: componente Astro `EventSignupForm` (HTML form classico, `method="post"`, no JS richiesto) inserito nella scheda evento.

**Tech Stack:** Postgres 16, postgres.js, resend, zod, Astro 5 SSR endpoints.

**Fuori scope:** altri form (volontari, tessera, segnalazioni, press request) → 04B; auth admin / pagina /admin → 05; foto/upload → 06; rate-limit / captcha → quando arriverà spam vero.

---

## Task 1 — docker-compose + schema iniziale

**Files:** `docker-compose.yml`, `db/migrations/001_init.sql`, `.env.example`, `package.json` (scripts), `.gitignore`.

- [ ] **Step 1: Crea `docker-compose.yml`** alla root del progetto:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: polesine36-db
    environment:
      POSTGRES_USER: polesine
      POSTGRES_PASSWORD: polesine
      POSTGRES_DB: polesine36
    ports:
      - "5433:5432"
    volumes:
      - polesine36_pgdata:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d:ro

volumes:
  polesine36_pgdata:
```

Note: la porta è 5433 sull'host per non collidere con eventuali altri Postgres locali.

- [ ] **Step 2: Crea `db/migrations/001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS event_signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug    text NOT NULL,
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text,
  party_size    integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  notes         text,
  source_lang   text NOT NULL CHECK (source_lang IN ('it','en')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_signups_event_slug_idx ON event_signups (event_slug);
CREATE INDEX IF NOT EXISTS event_signups_created_at_idx ON event_signups (created_at DESC);
```

`gen_random_uuid()` arriva da `pgcrypto` o dal core `pg_uuid_ossp` — Postgres 16 ha già `gen_random_uuid()` come funzione built-in (modulo `pgcrypto` non richiesto).

- [ ] **Step 3: Aggiungi a `.env.example`**

Leggi `.env.example` corrente (contiene già `SITE_URL`). Aggiungi sotto:

```
DATABASE_URL=postgres://polesine:polesine@localhost:5433/polesine36
RESEND_API_KEY=
ADMIN_EMAIL=alessandro.nicoli@mindmash.it
```

- [ ] **Step 4: Aggiungi script a `package.json`**

In `"scripts"`, accanto a `dev`, `build`, `test`, aggiungi:

```json
"db:up": "docker compose up -d",
"db:down": "docker compose down",
"db:logs": "docker compose logs -f db",
"db:reset": "docker compose down -v && docker compose up -d"
```

- [ ] **Step 5: `.gitignore`** — verifica che `.env` sia già ignorato (lo è). Nessuna modifica.

- [ ] **Step 6: Smoke test**

```bash
npm run db:up
docker exec polesine36-db psql -U polesine -d polesine36 -c "\dt"
```

Expected: la tabella `event_signups` esiste. Se la prima volta non c'è (race con init), `npm run db:reset` la ricrea.

- [ ] **Step 7: Commit (path espliciti)**

```bash
git add docker-compose.yml db/migrations/ .env.example package.json
git commit -m "feat(infra): postgres docker-compose + initial schema"
```

---

## Task 2 — Client DB

**Files:** `src/server/db.ts`, `package.json` (dep).

- [ ] **Step 1: Installa dipendenza**

```bash
npm install postgres
```

- [ ] **Step 2: Crea `src/server/db.ts`**

```ts
import postgres from 'postgres';

const url = import.meta.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

export const sql = postgres(url, {
  max: 4,
  idle_timeout: 20,
  connect_timeout: 5,
});

export type EventSignupRow = {
  id: string;
  event_slug: string;
  name: string;
  email: string;
  phone: string | null;
  party_size: number;
  notes: string | null;
  source_lang: 'it' | 'en';
  created_at: Date;
};
```

Niente test unitari qui: la libreria sottostante è già testata; un test di integrazione richiederebbe il DB up (lasciato al manuale «db:up + smoke»).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/server/db.ts
git commit -m "feat(server): postgres.js client wrapper"
```

---

## Task 3 — Client email (Resend)

**Files:** `src/server/email.ts`, `package.json` (dep).

- [ ] **Step 1: Installa dipendenza**

```bash
npm install resend
```

- [ ] **Step 2: Crea `src/server/email.ts`**

```ts
import { Resend } from 'resend';

const apiKey = import.meta.env.RESEND_API_KEY;
const adminEmail = import.meta.env.ADMIN_EMAIL;

if (!adminEmail) throw new Error('ADMIN_EMAIL not set');

const client = apiKey ? new Resend(apiKey) : null;

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  await sendEmail({ to: adminEmail, subject, text });
}

export async function sendEmail({ to, subject, text }: EmailPayload): Promise<void> {
  if (!client) {
    console.warn('[email] RESEND_API_KEY not set, skipping send', { to, subject });
    return;
  }
  const { error } = await client.emails.send({
    from: '36 m s.l.m. <noreply@polesineparmense36.it>',
    to,
    subject,
    text,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
```

Senza API key la funzione logga e non fallisce: utile per dev senza account Resend.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/server/email.ts
git commit -m "feat(server): resend email client wrapper"
```

---

## Task 4 — API endpoint event-signup (TDD su validazione)

**Files:** `src/server/validation/event-signup.ts`, `tests/unit/event-signup.test.ts`, `src/pages/api/event-signup.ts`.

- [ ] **Step 1: Test fallente** in `tests/unit/event-signup.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { eventSignupSchema } from '../../src/server/validation/event-signup';

describe('eventSignupSchema', () => {
  const valid = {
    eventSlug: '2026-05-10-camminata-golena',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    partySize: 2,
    sourceLang: 'it',
  };

  it('accepts a minimal valid payload', () => {
    const r = eventSignupSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejects missing name', () => {
    const r = eventSignupSchema.safeParse({ ...valid, name: '' });
    expect(r.success).toBe(false);
  });

  it('rejects bad email', () => {
    const r = eventSignupSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects partySize < 1', () => {
    const r = eventSignupSchema.safeParse({ ...valid, partySize: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects unknown sourceLang', () => {
    const r = eventSignupSchema.safeParse({ ...valid, sourceLang: 'fr' });
    expect(r.success).toBe(false);
  });

  it('coerces string partySize from form input', () => {
    const r = eventSignupSchema.safeParse({ ...valid, partySize: '3' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.partySize).toBe(3);
  });
});
```

- [ ] **Step 2: Run → fail** (`npm test`).

- [ ] **Step 3: Crea `src/server/validation/event-signup.ts`**

```ts
import { z } from 'zod';

export const eventSignupSchema = z.object({
  eventSlug: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('').transform(() => undefined)),
  partySize: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
  sourceLang: z.enum(['it', 'en']),
});

export type EventSignupInput = z.infer<typeof eventSignupSchema>;
```

- [ ] **Step 4: Run → pass** (totale 19 test: 13 + 6 nuovi).

- [ ] **Step 5: Crea `src/pages/api/event-signup.ts`**

```ts
import type { APIRoute } from 'astro';
import { eventSignupSchema } from '../../server/validation/event-signup';
import { sql } from '../../server/db';
import { sendAdminNotification } from '../../server/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const contentType = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = Object.fromEntries(form.entries());
  }

  const parsed = eventSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, errors: parsed.error.flatten() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = parsed.data;

  await sql`
    INSERT INTO event_signups (event_slug, name, email, phone, party_size, notes, source_lang)
    VALUES (${data.eventSlug}, ${data.name}, ${data.email}, ${data.phone ?? null}, ${data.partySize}, ${data.notes ?? null}, ${data.sourceLang})
  `;

  await sendAdminNotification(
    `[Polesine36] Nuova iscrizione: ${data.eventSlug}`,
    [
      `Evento: ${data.eventSlug}`,
      `Nome: ${data.name}`,
      `Email: ${data.email}`,
      `Telefono: ${data.phone ?? '—'}`,
      `Persone: ${data.partySize}`,
      `Note: ${data.notes ?? '—'}`,
      `Lingua: ${data.sourceLang}`,
    ].join('\n'),
  );

  const back = `/${data.sourceLang}/eventi/${data.eventSlug}/?signup=ok#iscrivimi`;

  if (contentType.includes('application/json')) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return redirect(back, 303);
};
```

- [ ] **Step 6: Commit**

```bash
git add src/server/validation/ tests/unit/event-signup.test.ts src/pages/api/event-signup.ts
git commit -m "feat(api): event-signup validation + endpoint"
```

---

## Task 5 — Form sulla scheda evento

**Files:** `src/components/EventSignupForm.astro`, `src/pages/[lang]/eventi/[...slug].astro` (modifica).

- [ ] **Step 1: Crea `src/components/EventSignupForm.astro`**

```astro
---
import { getLangFromUrl } from '../i18n/utils';
const { eventSlug } = Astro.props as { eventSlug: string };
const lang = getLangFromUrl(Astro.url);
const url = new URL(Astro.url);
const justSent = url.searchParams.get('signup') === 'ok';

const labels = lang === 'it'
  ? { title: 'Iscriviti all\'evento', name: 'Nome e cognome', email: 'Email', phone: 'Telefono (facoltativo)', size: 'Quante persone', notes: 'Note (facoltativo)', send: 'Invia iscrizione', ok: 'Iscrizione ricevuta. Ti scriviamo a conferma.' }
  : { title: 'Sign up for this event', name: 'Full name', email: 'Email', phone: 'Phone (optional)', size: 'How many people', notes: 'Notes (optional)', send: 'Send signup', ok: 'Signup received. We will email you to confirm.' };
---
<section id="iscrivimi" class="mt-10 rounded-2xl border border-pioppo p-5">
  <h2 class="font-hand text-3xl">{labels.title}</h2>

  {justSent && <p class="mt-3 rounded-lg bg-argento/60 p-3">{labels.ok}</p>}

  <form method="post" action="/api/event-signup" class="mt-4 grid gap-3">
    <input type="hidden" name="eventSlug" value={eventSlug} />
    <input type="hidden" name="sourceLang" value={lang} />

    <label class="grid gap-1 text-sm">
      <span>{labels.name}</span>
      <input name="name" required maxlength="120" class="rounded border border-argento bg-sabbia px-3 py-2" />
    </label>

    <label class="grid gap-1 text-sm">
      <span>{labels.email}</span>
      <input name="email" type="email" required maxlength="200" class="rounded border border-argento bg-sabbia px-3 py-2" />
    </label>

    <label class="grid gap-1 text-sm">
      <span>{labels.phone}</span>
      <input name="phone" maxlength="40" class="rounded border border-argento bg-sabbia px-3 py-2" />
    </label>

    <label class="grid gap-1 text-sm">
      <span>{labels.size}</span>
      <input name="partySize" type="number" min="1" max="20" value="1" required class="rounded border border-argento bg-sabbia px-3 py-2" />
    </label>

    <label class="grid gap-1 text-sm">
      <span>{labels.notes}</span>
      <textarea name="notes" rows="3" maxlength="2000" class="rounded border border-argento bg-sabbia px-3 py-2"></textarea>
    </label>

    <button type="submit" class="mt-2 inline-block rounded-full bg-pioppo px-5 py-2 text-white">{labels.send}</button>
  </form>
</section>
```

- [ ] **Step 2: Modifica `src/pages/[lang]/eventi/[...slug].astro`**

Leggi il file attuale. Sostituisci il blocco `{entry.data.signupRequired && (...)}` (il `<p id="iscrivimi" ...>` con il mailto stub) con:

```astro
{entry.data.signupRequired && <EventSignupForm eventSlug={entry.slug.split('/').slice(1).join('/')} />}
```

E aggiungi l'import in cima al frontmatter (dopo gli altri import):

```ts
import EventSignupForm from '../../../components/EventSignupForm.astro';
```

- [ ] **Step 3: Test E2E manuale**

```bash
npm run db:up
echo "RESEND_API_KEY=" >> .env   # se non esiste, crea .env partendo da .env.example
npm run dev
```

Apri http://localhost:4321/it/eventi/2026-05-10-camminata-golena/ → compila e invia il form → atteso: redirect alla stessa pagina con banner di conferma; `psql` mostra una riga in `event_signups`; il log della console riporta «[email] RESEND_API_KEY not set, skipping send».

- [ ] **Step 4: Build OK**

```bash
npm test && npm run build
```

Expected: 19/19 test PASS; build OK; l'endpoint API risulta server-rendered.

- [ ] **Step 5: Commit (path espliciti)**

```bash
git add "src/components/EventSignupForm.astro" "src/pages/[lang]/eventi/[...slug].astro"
git commit -m "feat(events): signup form on event detail page"
```

---

## Self-Review

**Spec coverage (questo sotto-piano):**
- Postgres locale con docker-compose ✓ Task 1
- Schema `event_signups` ✓ Task 1
- Client DB postgres.js ✓ Task 2
- Client email Resend (con fallback dev senza key) ✓ Task 3
- Validazione zod TDD ✓ Task 4
- Endpoint API SSR `/api/event-signup` ✓ Task 4
- Form HTML classico (no JS) sulla scheda evento ✓ Task 5

**Fuori scope (rimandato a sotto-piani successivi):**
- Altri form (volontari, tessera, segnalazioni, press request) → 04B (replicare il pattern di T4+T5)
- Auth admin + pagina /admin per vedere le iscrizioni → 05
- Foto pipeline (sharp watermark + originali privati) → 06
- Rate-limiting / honeypot → 07 quando spam reale

**Placeholder scan:** nessuno.

**Type consistency:** `EventSignupInput` (zod-derivato) vs `EventSignupRow` (DB) sono allineati come campi (`event_slug` ↔ `eventSlug`, eccetera) — la conversione avviene nell'INSERT esplicito.

**Rischi noti:**
- L'endpoint API **richiede** `prerender = false`. Astro 5 con `output: 'static' + adapter` non genera l'endpoint a meno di questa direttiva — è inclusa in T4.
- `sql` di postgres.js viene istanziato a load time e fallisce se `DATABASE_URL` non è definita: in CI/test occorre che la variabile sia presente o `src/server/db.ts` non venga importato. I test unitari di T4 importano solo `validation/event-signup.ts`, quindi non sono toccati.
- Senza `RESEND_API_KEY` il client logga e non invia: ottimo per dev, da ricordare in produzione.
- La porta 5433 sull'host: chi ha già un Postgres su 5432 non viene impattato; se la 5433 è occupata, basta cambiare la porta nel `docker-compose.yml` e in `.env`.

---

## Stato

Sotto-piano 04 pronto per esecuzione subagent-driven.
