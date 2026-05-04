# Polesine Parmense 36 — Sito ufficiale

Sito dell'associazione Polesine Parmense 36, costruito con Astro.

## Stack

- **Framework:** [Astro](https://astro.build) (modalità ibrida: pagine statiche + API server-side)
- **Stili:** Tailwind CSS
- **Database:** PostgreSQL tramite [Supabase](https://supabase.com)
- **Media:** [Supabase Storage](https://supabase.com/storage)
- **Email:** [Resend](https://resend.com)

## Infrastruttura di produzione

| Servizio | Provider | Account |
|----------|----------|---------|
| Hosting  | [Vercel](https://vercel.com)   | an.mindmash@gmail.com |
| Database | [Supabase](https://supabase.com) | an.mindmash@gmail.com |
| Storage  | [Supabase](https://supabase.com) | an.mindmash@gmail.com |

## Variabili d'ambiente

Le variabili necessarie sono elencate nel file `.env` (non committato). Per un nuovo setup:

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string Transaction pooler da Supabase |
| `SUPABASE_URL` | URL del progetto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key (solo per script di amministrazione) |
| `SUPABASE_BUCKET` | Nome del bucket Storage |
| `RESEND_API_KEY` | Chiave API Resend |
| `ADMIN_EMAIL` | Email destinatario notifiche iscrizioni |
| `SITE_URL` | URL pubblico del sito |

## Sviluppo locale

**Prerequisiti:** Docker, Node.js >= 22.12

```bash
npm install
npm run db:up    # avvia PostgreSQL in Docker
npm run dev      # http://localhost:4321
```

Per fermare il database:

```bash
npm run db:down
```

## Upload media su Supabase Storage

Per caricare i file media locali sul bucket Supabase:

```bash
node scripts/upload-media.mjs
```

## Deploy

Il deploy avviene automaticamente su Vercel ad ogni push su `main`.

Per un deploy manuale:

```bash
npx vercel --prod
```
