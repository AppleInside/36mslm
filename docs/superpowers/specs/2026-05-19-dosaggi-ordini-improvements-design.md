# Design: Miglioramenti Tabelle Dosaggi e Ordini

**Data:** 2026-05-19
**Progetto:** lunati_mes

---

## Requisiti

1. Toggle auto-refresh per tabella Dosaggi e tabella Ordini (ogni 3 secondi)
2. Filtro per Codice Manufatto (`codMan`) nella tabella Dosaggi (server-side)
3. Rinomina colonne principali nella tabella Dosaggi
4. Default "Crea Nuovo Ordine": Igrometro → NO, Avvio → Manuale

---

## 1. Toggle Auto-refresh

### Comportamento
- Pulsante toggle nella toolbar di ogni tabella (accanto a "Espandi/Riduci" per Dosaggi, autonomo per Ordini)
- Default: **OFF**
- Quando ON: la query React Query si re-esegue ogni 3 000 ms tramite `refetchInterval`
- Lo stato persiste nello store Zustand (sopravvive alla navigazione tra pagine)

### Implementazione

**`useDosaggiTableStore`** — aggiungere:
```ts
autoRefresh: boolean          // default false
toggleAutoRefresh: () => void
```
Persistito in `partialize`.

**`useOrdiniTableStore`** — lo store non esiste ancora; crearlo con gli stessi campi dello store Dosaggi (sortBy, sortOrder, currentPage, pageSize, showArchived, autoRefresh), persistito.

**`useDosaggi`** — aggiungere parametro `refetchInterval`:
```ts
export function useDosaggi(..., refetchInterval: number | false = false)
```

**`useOrdini`** — stessa modifica.

**`DosaggiTable`** — leggere `autoRefresh` dallo store, passarlo al hook; aggiungere pulsante toggle.

**`OrdiniTable`** — leggere `autoRefresh` dal nuovo store; aggiungere pulsante toggle.

---

## 2. Filtro Codice Manufatto (Dosaggi)

### Comportamento
- Input testuale nella toolbar della tabella Dosaggi con placeholder "Filtra per Manufatto..."
- Filtraggio server-side (necessario perché i dati sono paginati)
- Modificare il filtro resetta la pagina corrente a 1
- Filtro case-insensitive, ricerca per stringa contenuta (`contains`)

### Implementazione

**`useDosaggiTableStore`** — aggiungere:
```ts
codManFilter: string          // default ""
setCodManFilter: (v: string) => void
```
Non persistito (si azzera al refresh della pagina, comportamento atteso).

**`getDosaggi` (server action)** — aggiungere `codManFilter` alle opzioni:
```ts
interface GetDosaggiOptions {
  ...
  codManFilter?: string
}
```
Quando non vuoto, aggiungere `where: { codMan: { contains: codManFilter, mode: 'insensitive' } }` sia al `count` sia al `findMany`.

**`useDosaggi`** — aggiungere `codManFilter` come parametro, includerlo nella `queryKey`.

**`DosaggiTable`** — leggere `codManFilter` e `setCodManFilter` dallo store; aggiungere input di ricerca nella toolbar.

---

## 3. Rinomina Colonne Dosaggi

Aggiungere mappa `COLUMN_LABELS` in `lib/format.ts` e aggiornare `formatColumnName` per consultarla prima del fallback camelCase:

| Campo | Etichetta |
|---|---|
| `nPosto` | N. Stazione |
| `codMan` | Manufatto |
| `codFor` | Formula |
| `m3Ciclo` | Metri Cubi M³ |
| `temperat` | Temperatura |
| `timeTotal` | Tempo Totale |

Solo questi 6 campi. Gli altri usano il fallback camelCase esistente.

---

## 4. Default Form "Crea Nuovo Ordine"

In `features/ordini/CreateOrdineFormContent.tsx`, due cambiamenti nello stato iniziale e nel reset post-submit:

| Campo | Prima | Dopo |
|---|---|---|
| `slumptst` | `"1"` | `"0"` |
| `autoStart` | `"1"` | `"0"` |

---

## File Coinvolti

| File | Modifica |
|---|---|
| `lib/format.ts` | Aggiungere `COLUMN_LABELS`, aggiornare `formatColumnName` |
| `lib/types.ts` | Nessuna modifica necessaria |
| `hooks/useDosaggiTableStore.ts` | Aggiungere `autoRefresh`, `codManFilter` |
| `hooks/useOrdiniTableStore.ts` | Creare nuovo store |
| `hooks/useDosaggi.ts` | Aggiungere `refetchInterval`, `codManFilter` |
| `hooks/useOrdini.ts` | Aggiungere `refetchInterval` |
| `server/dosaggi.ts` | Aggiungere filtro `codManFilter` |
| `features/dosaggi/DosaggiTable.tsx` | Toggle auto-refresh, input filtro |
| `features/ordini/OrdiniTable.tsx` | Toggle auto-refresh, usare nuovo store |
| `features/ordini/CreateOrdineFormContent.tsx` | Cambiare default `slumptst` e `autoStart` |
