# Design: Anagrafica Articoli e Magazzini

**Data:** 2026-05-26  
**Progetto:** agrinascente-traceability  
**Scope:** Aggiunta di due nuove sezioni CRUD (Articoli e Magazzini) nell'area Anagrafiche esistente, accessibili tramite tab.

---

## Contesto

La pagina `/anagrafiche` gestisce attualmente Clienti/Fornitori/Vettori con un pattern CRUD consolidato: tabella con ricerca/paginazione, modal di creazione/modifica, dialog di conferma eliminazione, toast notification.

I modelli Prisma `aNAGR_Articoli` e `ANAGR_Magazzini` esistono già nello schema. L'API `/api/magazzini` esiste già parzialmente. L'API `/api/articoli` è da creare.

---

## Layout e Navigazione

La pagina `/anagrafiche/page.tsx` adotta un sistema a **tre tab** usando il componente `Tabs` di shadcn/ui:

| Tab | Contenuto |
|-----|-----------|
| Clienti/Fornitori/Vettori | Contenuto attuale (invariato) |
| Articoli | Nuova tabella CRUD articoli |
| Magazzini | Nuova tabella CRUD magazzini |

Il contenuto attuale della pagina viene estratto in un componente locale `ClientiFornitori` per mantenere leggibile il file principale.

---

## Anagrafica Articoli

### Modello Prisma (esistente)
```
aNAGR_Articoli: id, articleCode (unique), name, description?, units[], defaultWeight?, tags[], createdAt, updatedAt
```

### Campi esposti nel CRUD

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| articleCode | string | sì | Codice univoco |
| name | string | sì | Nome articolo |
| description | string | no | Testo libero |
| units | string[] | no | Default `["kg"]`, chip editabili |
| defaultWeight | decimal | no | Peso in kg |
| tags | string[] | no | Chip editabili |

I campi di produzione (`automatable`, `isAutomatic`, `daysSinceProductionMin/Max`, `parentArticleCode`) non sono esposti in questa anagrafica.

### Tabella (colonne visibili)
`Codice` | `Nome` | `Descrizione` | `Unità` | `Peso Default` | `Tag`

### API Routes da creare
- `GET /api/articoli` — lista con paginazione, ricerca su `articleCode`, `name`, `description`
- `POST /api/articoli` — crea articolo
- `GET /api/articoli/[id]` — singolo articolo
- `PATCH /api/articoli/[id]` — aggiorna
- `DELETE /api/articoli/[id]` — elimina

### Componente Modal
`src/components/modals/ArticoloModal.tsx`
- Sezioni: Dati Principali (codice, nome), Dettagli (descrizione, unità, peso), Tag
- Validazione: `articleCode` e `name` obbligatori
- Detect modifiche per disabilitare "Salva" in edit mode (stesso pattern di AnagraficaModal)

---

## Anagrafica Magazzini

### Modello Prisma (esistente)
```
ANAGR_Magazzini: id, magCode?, name?, description, address?, postalCode?, city?, province?, country?, internal (bool), latitude?, longitude?, active, ownerId? (omesso), createdAt, updatedAt
```

### Campi esposti nel CRUD

| Campo | Tipo | Obbligatorio | Note |
|-------|------|--------------|------|
| magCode | string | no | Codice magazzino univoco |
| name | string | no | Nome breve |
| description | string | sì | Descrizione |
| address | string | no | Via/Piazza |
| postalCode | string | no | CAP |
| city | string | no | Città |
| province | string | no | Provincia (2 lettere) |
| country | string | no | Default "Italia" |
| internal | boolean | no | Magazzino interno/esterno |
| latitude | float | no | Coordinata geografica |
| longitude | float | no | Coordinata geografica |
| active | boolean | no | Default true |

Il campo `ownerId` (proprietario) non è esposto in questa versione.

### Tabella (colonne visibili)
`Codice` | `Nome/Descrizione` | `Città` | `Interno` | `Attivo`

### API Routes
- Verificare e completare l'esistente `/api/magazzini` per supportare PATCH e DELETE su `[id]`
- `GET /api/magazzini` — lista con paginazione, ricerca su `magCode`, `name`, `description`, `city`
- `POST /api/magazzini` — crea magazzino
- `GET /api/magazzini/[id]`
- `PATCH /api/magazzini/[id]`
- `DELETE /api/magazzini/[id]`

### Componente Modal
`src/components/modals/MagazzinoModal.tsx`
- Sezioni: Dati Principali (codice, nome, descrizione, interno, attivo), Indirizzo (via, CAP, città, provincia, paese), Coordinate (lat, lng)
- Validazione: `description` obbligatorio
- Detect modifiche per disabilitare "Salva" in edit mode

---

## TypeScript Types

### Articolo (`src/types/articoli.ts`)
```typescript
interface Articolo {
  id: string;
  articleCode: string;
  name: string;
  description?: string | null;
  units: string[];
  defaultWeight?: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Magazzino (`src/types/magazzino.ts`)
Estende il tipo esistente o aggiunge:
```typescript
interface Magazzino {
  id: string;
  magCode?: string | null;
  name?: string | null;
  description: string;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  internal: boolean;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Pattern CRUD (identico all'esistente)

- Ricerca con debounce 300ms
- Paginazione 20 elementi per pagina
- Toast notification per successo/errore
- Dialog di conferma per eliminazione
- Modal con detect modifiche (disabilita Salva se nessun cambiamento in edit)
- Gestione valori NULL/stringa "NULL" con helper `toStr()`

---

## File da creare/modificare

| Operazione | File |
|-----------|------|
| Modifica | `src/app/anagrafiche/page.tsx` |
| Crea | `src/components/modals/ArticoloModal.tsx` |
| Crea | `src/components/modals/MagazzinoModal.tsx` |
| Crea | `src/types/articoli.ts` |
| Modifica | `src/types/magazzino.ts` |
| Crea | `src/app/api/articoli/route.ts` |
| Crea | `src/app/api/articoli/[id]/route.ts` |
| Verifica/Modifica | `src/app/api/magazzini/route.ts` |
| Verifica/Modifica | `src/app/api/magazzini/[id]/route.ts` |
