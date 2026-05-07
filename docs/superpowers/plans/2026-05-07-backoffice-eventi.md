# Backoffice — Sezione Eventi: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementare autenticazione admin e CRUD eventi nel backoffice raggiungibile via `/management`.

**Architecture:** Astro SSR ibrido — le pagine management hanno `prerender = false`, un middleware Astro protegge le route, sessioni via cookie HMAC-SHA256 signed, password verificata con bcryptjs contro la tabella `users` esistente.

**Tech Stack:** Astro 5 · bcryptjs · Zod · postgres.js · Tailwind · marked (già installato) · Supabase Storage (upload immagini)

---

## File map

```
NEW:
src/env.d.ts                                         — tipi Astro.locals
src/lib/auth.ts                                      — createSession, verifySession, verifyPassword
src/middleware.ts                                    — guard tutte le route /management/*
src/layouts/Management.astro                         — layout admin brandizzato
src/pages/management/index.astro                     — pagina login
src/pages/management/eventi/index.astro              — lista eventi
src/pages/management/eventi/nuovo.astro              — form crea evento
src/pages/management/eventi/[id].astro               — form modifica evento
src/pages/api/management/login.ts                    — POST login
src/pages/api/management/logout.ts                   — POST logout
src/server/validation/management-event.ts            — schema Zod evento
src/pages/api/management/eventi/create.ts            — POST crea evento
src/pages/api/management/eventi/[id]/update.ts       — POST aggiorna evento
src/pages/api/management/eventi/[id]/delete.ts       — POST elimina evento
tests/unit/auth.test.ts                              — unit test auth.ts

MODIFY:
.env                                                 — aggiungere SESSION_SECRET
```

---

### Task 1: Dipendenze, .env e utente DB

**Files:**
- Modify: `.env`

- [ ] **Step 1: Installa bcryptjs**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Expected output: `added X packages` senza errori.

- [ ] **Step 2: Aggiungi SESSION_SECRET a .env**

Apri `.env` e aggiungi in fondo:

```
SESSION_SECRET=cambia-questo-con-una-stringa-casuale-lunga-almeno-32-caratteri
```

Genera una stringa sicura con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Step 3: Crea un utente admin nel DB**

Prima genera l'hash bcrypt della tua password. Crea un file temporaneo `gen-hash.mjs`:

```js
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('LA-TUA-PASSWORD', 10);
console.log(hash);
```

Esegui: `node gen-hash.mjs` e copia l'output (inizia con `$2a$10$...`).

**Query SQL da eseguire su Supabase (SQL Editor):**

```sql
INSERT INTO users (email, password_hash, display_name)
VALUES (
  'tuaemail@example.com',
  '$2a$10$HASH_COPIATO_QUI',
  'Il Tuo Nome'
);
```

Cancella `gen-hash.mjs` dopo l'uso.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add bcryptjs for password verification"
```

---

### Task 2: Tipi locals + `src/lib/auth.ts` + test

**Files:**
- Create: `src/env.d.ts`
- Create: `src/lib/auth.ts`
- Create: `tests/unit/auth.test.ts`

- [ ] **Step 1: Crea `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    userId: number | null;
    userDisplayName: string;
  }
}
```

- [ ] **Step 2: Scrivi il test fallente per `auth.ts`**

Crea `tests/unit/auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing auth
vi.stubEnv('SESSION_SECRET', 'test-secret-1234567890abcdef1234567890ab');

const { createSession, verifySession } = await import('../../src/lib/auth');

describe('createSession / verifySession', () => {
  it('round-trip returns the original userId', () => {
    const token = createSession(42);
    expect(verifySession(token)).toBe(42);
  });

  it('returns null for a tampered signature', () => {
    const token = createSession(1);
    const parts = token.split(':');
    parts[2] = parts[2].replace(/a/g, 'b'); // tamper sig
    expect(verifySession(parts.join(':'))).toBeNull();
  });

  it('returns null for an expired token', () => {
    // Token with expires = 1 ms in the past
    const userId = 7;
    const expires = Date.now() - 1;
    const { createHmac } = await import('node:crypto');
    const payload = `${userId}:${expires}`;
    const sig = createHmac('sha256', 'test-secret-1234567890abcdef1234567890ab')
      .update(payload).digest('hex');
    const expired = `${payload}:${sig}`;
    expect(verifySession(expired)).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(verifySession('not-a-valid-token')).toBeNull();
    expect(verifySession('')).toBeNull();
    expect(verifySession('a:b')).toBeNull();
  });
});
```

- [ ] **Step 2b: Esegui il test per verificare che fallisca**

```bash
npm test -- --reporter=verbose tests/unit/auth.test.ts
```

Expected: FAIL con "Cannot find module" o simile.

- [ ] **Step 3: Implementa `src/lib/auth.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const COOKIE_NAME = 'mgmt_session';

function secret(): string {
  const s = import.meta.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET not set');
  return s;
}

export function createSession(userId: number): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}:${expires}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifySession(token: string): number | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [userIdStr, expiresStr, sig] = parts;
  const payload = `${userIdStr}:${expiresStr}`;
  const expected = createHmac('sha256', secret()).update(payload).digest('hex');
  try {
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  if (Date.now() > parseInt(expiresStr)) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Esegui i test per verificare che passino**

```bash
npm test -- --reporter=verbose tests/unit/auth.test.ts
```

Expected: 4 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/env.d.ts src/lib/auth.ts tests/unit/auth.test.ts
git commit -m "feat: auth session utilities with HMAC-SHA256"
```

---

### Task 3: Middleware `src/middleware.ts`

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Crea `src/middleware.ts`**

```ts
import { defineMiddleware } from 'astro:middleware';
import { verifySession, COOKIE_NAME } from './lib/auth';
import { sql } from './server/db';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  const needsAuth =
    pathname.startsWith('/management/') ||
    (pathname.startsWith('/api/management/') &&
      !pathname.startsWith('/api/management/login') &&
      !pathname.startsWith('/api/management/logout'));

  if (!needsAuth) return next();

  const token = ctx.cookies.get(COOKIE_NAME)?.value;
  const userId = token ? verifySession(token) : null;

  if (!userId) return ctx.redirect('/management', 302);

  const rows = await sql<{ display_name: string }[]>`
    SELECT display_name FROM users WHERE id = ${userId} LIMIT 1
  `;
  if (!rows.length) return ctx.redirect('/management', 302);

  ctx.locals.userId = userId;
  ctx.locals.userDisplayName = rows[0].display_name;

  return next();
});
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: management route guard middleware"
```

---

### Task 4: API login e logout

**Files:**
- Create: `src/pages/api/management/login.ts`
- Create: `src/pages/api/management/logout.ts`

- [ ] **Step 1: Crea `src/pages/api/management/login.ts`**

```ts
import type { APIRoute } from 'astro';
import { sql } from '../../../server/db';
import { createSession, verifyPassword, COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  if (!email || !password) return redirect('/management?err=credenziali', 303);

  const rows = await sql<{ id: number; password_hash: string }[]>`
    SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1
  `;

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return redirect('/management?err=credenziali', 303);
  }

  await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

  cookies.set(COOKIE_NAME, createSession(user.id), {
    httpOnly: true,
    sameSite: 'strict',
    secure: import.meta.env.PROD,
    path: '/management',
    maxAge: 24 * 60 * 60,
  });

  return redirect('/management/eventi', 303);
};
```

- [ ] **Step 2: Crea `src/pages/api/management/logout.ts`**

```ts
import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, cookies }) => {
  cookies.delete(COOKIE_NAME, { path: '/management' });
  return redirect('/management', 303);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/management/
git commit -m "feat: management login and logout endpoints"
```

---

### Task 5: Layout `src/layouts/Management.astro`

**Files:**
- Create: `src/layouts/Management.astro`

- [ ] **Step 1: Crea `src/layouts/Management.astro`**

```astro
---
import '../styles/global.css';
import { SITE } from '../consts';

interface Props {
  title: string;
  userDisplayName: string;
}
const { title, userDisplayName } = Astro.props;
const pathname = Astro.url.pathname;
---
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title} · Gestione · {SITE.name}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=IBM+Plex+Mono:wght@400;500&display=swap" />
  </head>
  <body class="min-h-screen flex flex-col bg-sabbia text-testo font-sans">

    <!-- Topbar -->
    <header class="bg-pioppo text-white flex items-center justify-between px-4 py-3 shadow-sm">
      <div class="flex items-center gap-3">
        <button id="sidebar-toggle" class="lg:hidden p-1 rounded hover:bg-white/10" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span class="font-serif font-medium tracking-wide">36 m s.l.m. — Gestione</span>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <span class="hidden sm:inline opacity-80">{userDisplayName}</span>
        <form method="POST" action="/api/management/logout">
          <button type="submit" class="px-3 py-1 rounded border border-white/40 hover:bg-white/10 transition-colors text-sm">
            Esci
          </button>
        </form>
      </div>
    </header>

    <div class="flex flex-1">
      <!-- Sidebar -->
      <aside id="sidebar" class="hidden lg:flex flex-col w-44 bg-argento/60 border-r border-pioppo/20 pt-4">
        <nav class="flex flex-col gap-1 px-2">
          <a
            href="/management/eventi"
            class:list={[
              'px-3 py-2 rounded text-sm font-medium transition-colors',
              pathname.startsWith('/management/eventi')
                ? 'bg-pioppo text-white'
                : 'text-testo hover:bg-pioppo/20'
            ]}
          >
            Eventi
          </a>
        </nav>
      </aside>

      <!-- Main -->
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>

    <script>
      const btn = document.getElementById('sidebar-toggle');
      const sidebar = document.getElementById('sidebar');
      btn?.addEventListener('click', () => {
        sidebar?.classList.toggle('hidden');
        sidebar?.classList.toggle('flex');
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Management.astro
git commit -m "feat: management layout with branded topbar and sidebar"
```

---

### Task 6: Pagina login `src/pages/management/index.astro`

**Files:**
- Create: `src/pages/management/index.astro`

- [ ] **Step 1: Crea `src/pages/management/index.astro`**

```astro
---
export const prerender = false;
import '../../styles/global.css';
import { SITE } from '../../consts';
import { COOKIE_NAME, verifySession } from '../../lib/auth';

// Se già autenticato, redirect diretto
const token = Astro.cookies.get(COOKIE_NAME)?.value;
if (token && verifySession(token)) {
  return Astro.redirect('/management/eventi', 302);
}

const err = Astro.url.searchParams.get('err');
---
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Accesso · Gestione · {SITE.name}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=IBM+Plex+Mono:wght@400&display=swap" />
  </head>
  <body class="min-h-screen flex items-center justify-center bg-sabbia text-testo font-sans">
    <div class="w-full max-w-sm px-4">
      <h1 class="font-serif text-2xl font-medium text-center mb-8 text-pioppo">
        36 m s.l.m.
      </h1>

      {err && (
        <p class="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          Email o password non corretti.
        </p>
      )}

      <form method="POST" action="/api/management/login" class="flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-argento p-6">
        <div class="flex flex-col gap-1">
          <label for="email" class="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autocomplete="email"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="password" class="text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="current-password"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo"
          />
        </div>
        <button
          type="submit"
          class="mt-2 bg-pioppo hover:bg-pioppo/90 text-white font-medium py-2 rounded transition-colors"
        >
          Accedi
        </button>
      </form>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/management/index.astro
git commit -m "feat: management login page"
```

---

### Task 7: Schema Zod + Lista eventi

**Files:**
- Create: `src/server/validation/management-event.ts`
- Create: `src/pages/management/eventi/index.astro`

- [ ] **Step 1: Crea `src/server/validation/management-event.ts`**

```ts
import { z } from 'zod';

const optionalStr = z.string().transform(v => v.trim() || null).nullable();

export const managementEventSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').transform(v => v.trim()),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug: solo lettere minuscole, numeri e trattini'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  time_start: optionalStr,
  time_end: optionalStr,
  location: optionalStr,
  description: optionalStr,
  signup_required: z.preprocess(v => v === 'on' || v === true, z.boolean()).default(false),
  status: z.enum(['draft', 'published']),
});

export type ManagementEventInput = z.infer<typeof managementEventSchema>;
```

- [ ] **Step 2: Crea `src/pages/management/eventi/index.astro`**

```astro
---
export const prerender = false;
import Management from '../../../layouts/Management.astro';
import { sql } from '../../../server/db';

const userId = Astro.locals.userId!;
const userDisplayName = Astro.locals.userDisplayName;

type EventRow = {
  id: number;
  title: string;
  date: string;
  location: string | null;
  signup_required: boolean;
  status: 'draft' | 'published';
};

const events = await sql<EventRow[]>`
  SELECT id, title, date::text, location, signup_required, status
  FROM events
  WHERE lang = 'it'
  ORDER BY date DESC
`;

const ok = Astro.url.searchParams.get('ok');
const err = Astro.url.searchParams.get('err');
---
<Management title="Eventi" userDisplayName={userDisplayName}>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif text-2xl font-medium">Eventi</h1>
      <a
        href="/management/eventi/nuovo"
        class="bg-pioppo hover:bg-pioppo/90 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        + Nuovo evento
      </a>
    </div>

    {ok && (
      <p class="mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        Operazione completata.
      </p>
    )}
    {err && (
      <p class="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        Si è verificato un errore. Riprova.
      </p>
    )}

    <div class="bg-white rounded-xl shadow-sm border border-argento overflow-hidden">
      {events.length === 0 ? (
        <p class="px-6 py-8 text-center text-sm text-testo/50">Nessun evento. Creane uno!</p>
      ) : (
        <table class="w-full text-sm">
          <thead class="bg-argento/40 border-b border-argento text-left">
            <tr>
              <th class="px-4 py-3 font-medium">Titolo</th>
              <th class="px-4 py-3 font-medium">Data</th>
              <th class="px-4 py-3 font-medium hidden md:table-cell">Luogo</th>
              <th class="px-4 py-3 font-medium hidden sm:table-cell">Iscrizioni</th>
              <th class="px-4 py-3 font-medium">Stato</th>
              <th class="px-4 py-3 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-argento/40">
            {events.map(ev => (
              <tr class="hover:bg-sabbia/60 transition-colors">
                <td class="px-4 py-3 font-medium">{ev.title}</td>
                <td class="px-4 py-3 font-mono text-xs">{ev.date}</td>
                <td class="px-4 py-3 hidden md:table-cell text-testo/70">{ev.location ?? '—'}</td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  {ev.signup_required ? (
                    <span class="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">Sì</span>
                  ) : (
                    <span class="text-xs text-testo/40">No</span>
                  )}
                </td>
                <td class="px-4 py-3">
                  {ev.status === 'published' ? (
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Pubblicato</span>
                  ) : (
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Bozza</span>
                  )}
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a
                      href={`/management/eventi/${ev.id}`}
                      class="text-brand hover:underline text-xs"
                    >
                      Modifica
                    </a>
                    <form
                      method="POST"
                      action={`/api/management/eventi/${ev.id}/delete`}
                      class="inline"
                      onsubmit="return confirm('Eliminare questo evento?')"
                    >
                      <button type="submit" class="text-red-500 hover:underline text-xs">
                        Elimina
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
</Management>
```

- [ ] **Step 3: Commit**

```bash
git add src/server/validation/management-event.ts src/pages/management/eventi/index.astro
git commit -m "feat: management events list and Zod schema"
```

---

### Task 8: Form nuovo evento + API create

**Files:**
- Create: `src/pages/management/eventi/nuovo.astro`
- Create: `src/pages/api/management/eventi/create.ts`

- [ ] **Step 1: Crea `src/pages/management/eventi/nuovo.astro`**

```astro
---
export const prerender = false;
import Management from '../../../layouts/Management.astro';

const userDisplayName = Astro.locals.userDisplayName;
---
<Management title="Nuovo evento" userDisplayName={userDisplayName}>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <a href="/management/eventi" class="text-sm text-testo/50 hover:text-testo">← Lista eventi</a>
      <h1 class="font-serif text-2xl font-medium">Nuovo evento</h1>
    </div>

    <form
      method="POST"
      action="/api/management/eventi/create"
      enctype="multipart/form-data"
      class="bg-white rounded-xl shadow-sm border border-argento p-6 flex flex-col gap-5"
    >
      <!-- Titolo -->
      <div class="flex flex-col gap-1">
        <label for="title" class="text-sm font-medium">Titolo <span class="text-red-500">*</span></label>
        <input id="title" name="title" type="text" required
          class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
      </div>

      <!-- Slug -->
      <div class="flex flex-col gap-1">
        <label for="slug" class="text-sm font-medium">Slug <span class="text-red-500">*</span></label>
        <input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+"
          class="border border-argento rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pioppo" />
        <p class="text-xs text-testo/50">Generato automaticamente dal titolo. Solo minuscole, numeri e trattini.</p>
      </div>

      <!-- Data / Orari -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label for="date" class="text-sm font-medium">Data <span class="text-red-500">*</span></label>
          <input id="date" name="date" type="date" required
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="time_start" class="text-sm font-medium">Ora inizio</label>
          <input id="time_start" name="time_start" type="time"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="time_end" class="text-sm font-medium">Ora fine</label>
          <input id="time_end" name="time_end" type="time"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
      </div>

      <!-- Luogo -->
      <div class="flex flex-col gap-1">
        <label for="location" class="text-sm font-medium">Luogo</label>
        <input id="location" name="location" type="text"
          class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
      </div>

      <!-- Descrizione Markdown -->
      <div class="flex flex-col gap-1">
        <label for="description" class="text-sm font-medium">Descrizione (Markdown)</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea id="description" name="description" rows="8"
            class="border border-argento rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pioppo resize-y"
          ></textarea>
          <div id="md-preview"
            class="border border-argento rounded px-3 py-2 text-sm prose prose-sm max-w-none min-h-[8rem] bg-sabbia/40"
          >
            <span class="text-testo/30 text-xs">Anteprima...</span>
          </div>
        </div>
      </div>

      <!-- Immagine copertina -->
      <div class="flex flex-col gap-1">
        <label for="cover" class="text-sm font-medium">Immagine copertina</label>
        <input id="cover" name="cover" type="file" accept="image/*"
          class="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-pioppo/10 file:text-pioppo file:text-sm file:cursor-pointer hover:file:bg-pioppo/20" />
        <p class="text-xs text-testo/50">Max 5 MB. Formati: JPG, PNG, WebP.</p>
      </div>

      <!-- Iscrizioni + Stato -->
      <div class="flex flex-col sm:flex-row gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input name="signup_required" type="checkbox" value="on"
            class="w-4 h-4 rounded accent-pioppo" />
          <span class="text-sm font-medium">Iscrizioni richieste</span>
        </label>
        <div class="flex flex-col gap-1 sm:ml-auto">
          <label for="status" class="text-sm font-medium">Stato</label>
          <select id="status" name="status"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo">
            <option value="draft">Bozza</option>
            <option value="published">Pubblicato</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-argento">
        <a href="/management/eventi"
          class="px-4 py-2 text-sm rounded border border-argento hover:bg-argento/30 transition-colors">
          Annulla
        </a>
        <button type="submit"
          class="px-4 py-2 text-sm font-medium bg-pioppo hover:bg-pioppo/90 text-white rounded transition-colors">
          Crea evento
        </button>
      </div>
    </form>
  </div>
</Management>

<script>
  import { marked } from 'marked';
  import { slugify } from '../../../lib/slug';

  const titleInput = document.getElementById('title') as HTMLInputElement;
  const slugInput = document.getElementById('slug') as HTMLInputElement;
  const descTextarea = document.getElementById('description') as HTMLTextAreaElement;
  const preview = document.getElementById('md-preview');

  let slugEdited = false;

  titleInput?.addEventListener('input', () => {
    if (!slugEdited) {
      slugInput.value = slugify(titleInput.value);
    }
  });

  slugInput?.addEventListener('input', () => {
    slugEdited = slugInput.value !== '';
  });

  function updatePreview() {
    if (!preview) return;
    const text = descTextarea?.value ?? '';
    preview.innerHTML = text ? String(marked.parse(text)) : '<span class="text-testo/30 text-xs">Anteprima...</span>';
  }

  descTextarea?.addEventListener('input', updatePreview);
</script>
```

- [ ] **Step 2: Crea `src/pages/api/management/eventi/create.ts`**

```ts
import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementEventSchema } from '../../../../server/validation/management-event';
import { verifySession, COOKIE_NAME } from '../../../../lib/auth';

export const prerender = false;

async function uploadToSupabase(file: File, path: string): Promise<string> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY;
  const bucket = import.meta.env.SUPABASE_BUCKET;
  const bytes = await file.arrayBuffer();
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  // Double-check auth
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementEventSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/eventi?err=validazione', 303);

  const d = parsed.data;
  let cover_url: string | null = null;

  const coverFile = form.get('cover') as File | null;
  if (coverFile && coverFile.size > 0) {
    if (!coverFile.type.startsWith('image/')) return redirect('/management/eventi?err=immagine', 303);
    if (coverFile.size > 5 * 1024 * 1024) return redirect('/management/eventi?err=immagine', 303);
    const ext = coverFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    cover_url = await uploadToSupabase(coverFile, `eventi/${d.slug}.${ext}`);
  }

  await sql`
    INSERT INTO events (lang, slug, title, date, time_start, time_end, location, description, cover_url, signup_required, status)
    VALUES ('it', ${d.slug}, ${d.title}, ${d.date}, ${d.time_start}, ${d.time_end}, ${d.location}, ${d.description}, ${cover_url}, ${d.signup_required}, ${d.status})
  `;

  return redirect('/management/eventi?ok=1', 303);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/management/eventi/nuovo.astro src/pages/api/management/eventi/create.ts
git commit -m "feat: create event form and API endpoint"
```

---

### Task 9: Form modifica evento + API update

**Files:**
- Create: `src/pages/management/eventi/[id].astro`
- Create: `src/pages/api/management/eventi/[id]/update.ts`

- [ ] **Step 1: Crea `src/pages/management/eventi/[id].astro`**

```astro
---
export const prerender = false;
import Management from '../../../layouts/Management.astro';
import { sql } from '../../../server/db';

const userDisplayName = Astro.locals.userDisplayName;
const { id } = Astro.params;

type EventRow = {
  id: number; title: string; slug: string; date: Date;
  time_start: string | null; time_end: string | null;
  location: string | null; description: string | null;
  cover_url: string | null; signup_required: boolean;
  status: 'draft' | 'published';
};

const rows = await sql<EventRow[]>`
  SELECT id, title, slug, date, time_start, time_end, location, description, cover_url, signup_required, status
  FROM events WHERE id = ${Number(id)} AND lang = 'it' LIMIT 1
`;
const event = rows[0];
if (!event) return Astro.redirect('/management/eventi?err=1', 302);

const dateStr = event.date instanceof Date
  ? event.date.toISOString().slice(0, 10)
  : String(event.date).slice(0, 10);
const timeStart = event.time_start?.slice(0, 5) ?? '';
const timeEnd = event.time_end?.slice(0, 5) ?? '';
---
<Management title={`Modifica: ${event.title}`} userDisplayName={userDisplayName}>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <a href="/management/eventi" class="text-sm text-testo/50 hover:text-testo">← Lista eventi</a>
      <h1 class="font-serif text-2xl font-medium">Modifica evento</h1>
    </div>

    <form
      method="POST"
      action={`/api/management/eventi/${event.id}/update`}
      enctype="multipart/form-data"
      class="bg-white rounded-xl shadow-sm border border-argento p-6 flex flex-col gap-5"
    >
      <div class="flex flex-col gap-1">
        <label for="title" class="text-sm font-medium">Titolo <span class="text-red-500">*</span></label>
        <input id="title" name="title" type="text" required value={event.title}
          class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="slug" class="text-sm font-medium">Slug <span class="text-red-500">*</span></label>
        <input id="slug" name="slug" type="text" required pattern="[a-z0-9-]+" value={event.slug}
          class="border border-argento rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pioppo" />
        <p class="text-xs text-testo/50">Attenzione: modificare lo slug rompe i link esistenti.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <label for="date" class="text-sm font-medium">Data <span class="text-red-500">*</span></label>
          <input id="date" name="date" type="date" required value={dateStr}
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="time_start" class="text-sm font-medium">Ora inizio</label>
          <input id="time_start" name="time_start" type="time" value={timeStart}
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
        <div class="flex flex-col gap-1">
          <label for="time_end" class="text-sm font-medium">Ora fine</label>
          <input id="time_end" name="time_end" type="time" value={timeEnd}
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="location" class="text-sm font-medium">Luogo</label>
        <input id="location" name="location" type="text" value={event.location ?? ''}
          class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="description" class="text-sm font-medium">Descrizione (Markdown)</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea id="description" name="description" rows="8"
            class="border border-argento rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pioppo resize-y"
          >{event.description ?? ''}</textarea>
          <div id="md-preview"
            class="border border-argento rounded px-3 py-2 text-sm prose prose-sm max-w-none min-h-[8rem] bg-sabbia/40">
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="cover" class="text-sm font-medium">Immagine copertina</label>
        {event.cover_url && (
          <p class="text-xs text-testo/50 mb-1">
            Immagine attuale: <a href={event.cover_url} target="_blank" class="text-brand hover:underline">visualizza</a>
          </p>
        )}
        <input id="cover" name="cover" type="file" accept="image/*"
          class="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-pioppo/10 file:text-pioppo file:text-sm file:cursor-pointer hover:file:bg-pioppo/20" />
        <p class="text-xs text-testo/50">Lascia vuoto per mantenere l'immagine attuale. Max 5 MB.</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input name="signup_required" type="checkbox" value="on"
            checked={event.signup_required}
            class="w-4 h-4 rounded accent-pioppo" />
          <span class="text-sm font-medium">Iscrizioni richieste</span>
        </label>
        <div class="flex flex-col gap-1 sm:ml-auto">
          <label for="status" class="text-sm font-medium">Stato</label>
          <select id="status" name="status"
            class="border border-argento rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pioppo">
            <option value="draft" selected={event.status === 'draft'}>Bozza</option>
            <option value="published" selected={event.status === 'published'}>Pubblicato</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-argento">
        <a href="/management/eventi"
          class="px-4 py-2 text-sm rounded border border-argento hover:bg-argento/30 transition-colors">
          Annulla
        </a>
        <button type="submit"
          class="px-4 py-2 text-sm font-medium bg-pioppo hover:bg-pioppo/90 text-white rounded transition-colors">
          Salva modifiche
        </button>
      </div>
    </form>
  </div>
</Management>

<script>
  import { marked } from 'marked';

  const descTextarea = document.getElementById('description') as HTMLTextAreaElement;
  const preview = document.getElementById('md-preview');

  function updatePreview() {
    if (!preview) return;
    const text = descTextarea?.value ?? '';
    preview.innerHTML = text ? String(marked.parse(text)) : '<span class="text-testo/30 text-xs">Anteprima...</span>';
  }

  descTextarea?.addEventListener('input', updatePreview);
  updatePreview();
</script>
```

- [ ] **Step 2: Crea `src/pages/api/management/eventi/[id]/update.ts`**

```ts
import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { managementEventSchema } from '../../../../../server/validation/management-event';
import { verifySession, COOKIE_NAME } from '../../../../../lib/auth';

export const prerender = false;

async function uploadToSupabase(file: File, path: string): Promise<string> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY;
  const bucket = import.meta.env.SUPABASE_BUCKET;
  const bytes = await file.arrayBuffer();
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export const POST: APIRoute = async ({ request, redirect, cookies, params }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const eventId = Number(params.id);
  if (isNaN(eventId)) return redirect('/management/eventi?err=1', 303);

  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementEventSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/eventi?err=validazione', 303);

  const d = parsed.data;

  // Keep existing cover_url if no new file uploaded
  const coverFile = form.get('cover') as File | null;
  let cover_url: string | null | undefined = undefined;

  if (coverFile && coverFile.size > 0) {
    if (!coverFile.type.startsWith('image/')) return redirect(`/management/eventi/${eventId}?err=immagine`, 303);
    if (coverFile.size > 5 * 1024 * 1024) return redirect(`/management/eventi/${eventId}?err=immagine`, 303);
    const ext = coverFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    cover_url = await uploadToSupabase(coverFile, `eventi/${d.slug}.${ext}`);
  }

  if (cover_url !== undefined) {
    await sql`
      UPDATE events
      SET title=${d.title}, slug=${d.slug}, date=${d.date}, time_start=${d.time_start},
          time_end=${d.time_end}, location=${d.location}, description=${d.description},
          cover_url=${cover_url}, signup_required=${d.signup_required}, status=${d.status}
      WHERE id=${eventId} AND lang='it'
    `;
  } else {
    await sql`
      UPDATE events
      SET title=${d.title}, slug=${d.slug}, date=${d.date}, time_start=${d.time_start},
          time_end=${d.time_end}, location=${d.location}, description=${d.description},
          signup_required=${d.signup_required}, status=${d.status}
      WHERE id=${eventId} AND lang='it'
    `;
  }

  return redirect('/management/eventi?ok=1', 303);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/management/eventi/[id].astro src/pages/api/management/eventi/
git commit -m "feat: edit event form and update endpoint"
```

---

### Task 10: API delete

**Files:**
- Create: `src/pages/api/management/eventi/[id]/delete.ts`

- [ ] **Step 1: Crea `src/pages/api/management/eventi/[id]/delete.ts`**

```ts
import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { verifySession, COOKIE_NAME } from '../../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, cookies, params }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const eventId = Number(params.id);
  if (isNaN(eventId)) return redirect('/management/eventi?err=1', 303);

  await sql`DELETE FROM events WHERE id = ${eventId} AND lang = 'it'`;

  return redirect('/management/eventi?ok=1', 303);
};
```

- [ ] **Step 2: Esegui tutti i test per verificare che nulla sia rotto**

```bash
npm test
```

Expected: tutti i test precedenti passano.

- [ ] **Step 3: Commit finale**

```bash
git add src/pages/api/management/eventi/
git commit -m "feat: delete event endpoint"
```

---

## Checklist verifica finale

- [ ] `npm run build` completa senza errori TypeScript
- [ ] Login funziona con le credenziali inserite nel DB
- [ ] Redirect a `/management/eventi` dopo login
- [ ] Accesso diretto a `/management/eventi` senza cookie → redirect a `/management`
- [ ] Crea evento: appare in lista, visibile anche nel sito pubblico se `status=published`
- [ ] Modifica evento: i campi sono pre-popolati, salvataggio aggiorna il DB
- [ ] Elimina evento: confirm JS, poi scompare dalla lista
- [ ] Upload immagine: URL salvato in `cover_url`, visibile nell'evento pubblico

---

## Query DB riepilogo (per Supabase SQL Editor)

```sql
-- Inserisci il primo utente admin (genera l'hash con node gen-hash.mjs prima)
INSERT INTO users (email, password_hash, display_name)
VALUES ('tuaemail@example.com', '$2a$10$HASH_QUI', 'Il Tuo Nome');

-- Verifica che l'utente sia stato inserito
SELECT id, email, display_name, created_at FROM users;
```
