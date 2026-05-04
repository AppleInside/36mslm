# Polesine Parmense 36 — Sito ufficiale

Sito dell'associazione Polesine Parmense 36, costruito con Astro.

## Stack

- **Framework:** [Astro](https://astro.build) (modalità ibrida: pagine statiche + API server-side)
- **Stili:** Tailwind CSS
- **Database:** PostgreSQL tramite [Neon](https://neon.tech)
- **Email:** [Resend](https://resend.com)

## Infrastruttura di produzione

| Servizio | Provider | Account |
|----------|----------|---------|
| Hosting  | [Vercel](https://vercel.com) | an.mindmash@gmail.com |
| Database | [Neon](https://neon.tech)   | an.mindmash@gmail.com |

## Variabili d'ambiente

Copiale da `.env.example` e valorizzale:

```
DATABASE_URL=        # Connection string pooled da Neon
RESEND_API_KEY=      # Chiave API Resend
ADMIN_EMAIL=         # Email destinatario notifiche iscrizioni
SITE_URL=            # URL pubblico del sito
```

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

## Deploy

Il deploy avviene automaticamente su Vercel ad ogni push su `main`.

Per un deploy manuale:

```bash
npx vercel --prod
```
