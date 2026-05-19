# Dosaggi/Ordini Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere toggle auto-refresh (3s) a entrambe le tabelle, filtro Cod. Manufatto server-side alla tabella Dosaggi, rinominare 6 colonne Dosaggi, correggere i default del form "Crea Nuovo Ordine".

**Architecture:** Ogni feature è indipendente. Lo stato UI vive negli store Zustand esistenti (`useDosaggiTableStore`, `useOrdiniTableStore`). Il filtro `codManFilter` è passato fino al server action Prisma. Il polling si abilita tramite `refetchInterval` di React Query.

**Tech Stack:** Next.js 15, React 19, React Query 5, Zustand 4, Prisma 5, Tailwind CSS, TypeScript

---

## File Map

| File | Operazione | Motivo |
|---|---|---|
| `lib/format.ts` | Modifica | Aggiungere `COLUMN_LABELS` + aggiornare `formatColumnName` |
| `hooks/useDosaggiTableStore.ts` | Modifica | Aggiungere `autoRefresh`, `codManFilter` |
| `hooks/useOrdiniTableStore.ts` | Modifica | Aggiungere `autoRefresh` |
| `hooks/useDosaggi.ts` | Modifica | Aggiungere `refetchInterval`, `codManFilter` |
| `hooks/useOrdini.ts` | Modifica | Aggiungere `refetchInterval` |
| `server/dosaggi.ts` | Modifica | Aggiungere filtro `codManFilter` su `count` e `findMany` |
| `features/dosaggi/DosaggiTable.tsx` | Modifica | Toggle auto-refresh + input filtro Manufatto |
| `features/ordini/OrdiniTable.tsx` | Modifica | Toggle auto-refresh |
| `features/ordini/CreateOrdineFormContent.tsx` | Modifica | Default `slumptst: "0"`, `autoStart: "0"` |

---

## Task 1: Rinomina colonne Dosaggi

**Files:**
- Modify: `lib/format.ts`

- [ ] **Step 1: Aggiungere `COLUMN_LABELS` e aggiornare `formatColumnName`**

Sostituire l'intera funzione `formatColumnName` in `lib/format.ts` con:

```ts
const COLUMN_LABELS: Record<string, string> = {
  nPosto: "N. Stazione",
  codMan: "Manufatto",
  codFor: "Formula",
  m3Ciclo: "Metri Cubi M³",
  temperat: "Temperatura",
  timeTotal: "Tempo Totale",
};

export function formatColumnName(field: string): string {
  if (COLUMN_LABELS[field]) return COLUMN_LABELS[field];
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
```

- [ ] **Step 2: Verificare visivamente**

Avviare il dev server (`npm run dev`) e aprire la pagina Dosaggi. Le colonne devono mostrare: "N. Stazione", "Manufatto", "Formula", "Metri Cubi M³", "Temperatura", "Tempo Totale" al posto dei nomi tecnici.

- [ ] **Step 3: Commit**

```bash
git add lib/format.ts
git commit -m "feat: rinomina colonne principali tabella Dosaggi"
```

---

## Task 2: Default form "Crea Nuovo Ordine"

**Files:**
- Modify: `features/ordini/CreateOrdineFormContent.tsx`

- [ ] **Step 1: Cambiare i default in `useState`** (riga ~18-26)

Sostituire i valori iniziali:

```ts
const [formData, setFormData] = useState({
  codFor: "",
  codMan: "",
  codCust: "",
  m3Ord: "",
  stazLav: "1",
  slumptst: "0",   // era "1"
  autoStart: "0",  // era "1"
});
```

- [ ] **Step 2: Cambiare il reset post-submit** (riga ~75-83)

Stessa modifica nel blocco di reset dentro `handleSubmit`:

```ts
setFormData({
  codFor: "",
  codMan: "",
  codCust: "",
  m3Ord: "",
  stazLav: "1",
  slumptst: "0",   // era "1"
  autoStart: "0",  // era "1"
});
```

- [ ] **Step 3: Verificare visivamente**

Aprire il modal "Crea Nuovo Ordine". I campi "Igrometro Mescolatrice" e "Avvio Automatico" devono mostrare "✗ NO" e "✗ Manuale (operatore preme start)" come selezione di default.

- [ ] **Step 4: Commit**

```bash
git add features/ordini/CreateOrdineFormContent.tsx
git commit -m "feat: default Igrometro=NO e Avvio=Manuale nel form ordine"
```

---

## Task 3: Auto-refresh toggle — Store

**Files:**
- Modify: `hooks/useDosaggiTableStore.ts`
- Modify: `hooks/useOrdiniTableStore.ts`

- [ ] **Step 1: Aggiungere `autoRefresh` al DosaggiTableStore**

In `hooks/useDosaggiTableStore.ts`, aggiornare l'interfaccia e lo store:

```ts
interface DosaggiTableStore {
  sortBy: DosaggiSortField;
  sortOrder: "asc" | "desc";
  showSecondaryColumns: boolean;
  currentPage: number;
  pageSize: number;
  autoRefresh: boolean;           // NEW

  setSortBy: (field: DosaggiSortField) => void;
  toggleSortOrder: () => void;
  toggleSecondaryColumns: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleAutoRefresh: () => void;  // NEW
}
```

Nel corpo dello store, aggiungere il valore iniziale e l'azione:

```ts
autoRefresh: false,

toggleAutoRefresh: () =>
  set((state) => ({ autoRefresh: !state.autoRefresh })),
```

In `partialize`, aggiungere `autoRefresh`:

```ts
partialize: (state) => ({
  showSecondaryColumns: state.showSecondaryColumns,
  pageSize: state.pageSize,
  autoRefresh: state.autoRefresh,
}),
```

- [ ] **Step 2: Aggiungere `autoRefresh` al OrdiniTableStore**

In `hooks/useOrdiniTableStore.ts`, stessa modifica:

```ts
interface OrdiniTableStore {
  sortBy: OrdiniSortField;
  sortOrder: "asc" | "desc";
  currentPage: number;
  pageSize: number;
  showArchived: boolean;
  autoRefresh: boolean;           // NEW

  setSortBy: (field: OrdiniSortField) => void;
  toggleSortOrder: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleShowArchived: () => void;
  toggleAutoRefresh: () => void;  // NEW
}
```

Nel corpo:

```ts
autoRefresh: false,

toggleAutoRefresh: () =>
  set((state) => ({ autoRefresh: !state.autoRefresh })),
```

In `partialize`:

```ts
partialize: (state) => ({
  pageSize: state.pageSize,
  autoRefresh: state.autoRefresh,
}),
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useDosaggiTableStore.ts hooks/useOrdiniTableStore.ts
git commit -m "feat: aggiungere autoRefresh agli store tabelle"
```

---

## Task 4: Auto-refresh toggle — Hook e UI

**Files:**
- Modify: `hooks/useDosaggi.ts`
- Modify: `hooks/useOrdini.ts`
- Modify: `features/dosaggi/DosaggiTable.tsx`
- Modify: `features/ordini/OrdiniTable.tsx`

- [ ] **Step 1: Aggiornare `useDosaggi` per supportare `refetchInterval`**

In `hooks/useDosaggi.ts`:

```ts
export function useDosaggi(
  sortBy: DosaggiSortField,
  sortOrder: "asc" | "desc",
  page: number = 1,
  pageSize: number = 10,
  codManFilter: string = "",
  refetchInterval: number | false = false
) {
  return useQuery<GetDosaggiResult, Error>({
    queryKey: ["dosaggi", sortBy, sortOrder, page, pageSize, codManFilter],
    queryFn: () => getDosaggi({ sortBy, sortOrder, page, pageSize, codManFilter }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval,
  });
}
```

(Il parametro `codManFilter` viene aggiunto qui in anticipo — sarà usato nel Task 5.)

- [ ] **Step 2: Aggiornare `useOrdini` per supportare `refetchInterval`**

In `hooks/useOrdini.ts`, aggiungere il parametro alla firma:

```ts
export function useOrdini(
  sortBy: OrdiniSortField,
  sortOrder: "asc" | "desc",
  page: number = 1,
  pageSize: number = 25,
  showArchived: boolean = false,
  refetchInterval: number | false = false
) {
  return useQuery<GetOrdiniResult, Error>({
    queryKey: ["ordini", sortBy, sortOrder, page, pageSize, showArchived],
    queryFn: () => getOrdini({ sortBy, sortOrder, page, pageSize, showArchived }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval,
  });
}
```

- [ ] **Step 3: Aggiungere il toggle in `DosaggiTable`**

In `features/dosaggi/DosaggiTable.tsx`:

Aggiornare gli import da `useDosaggiTableStore`:
```ts
const { sortBy, sortOrder, showSecondaryColumns, currentPage, pageSize,
        autoRefresh, setSortBy, toggleSecondaryColumns, setCurrentPage,
        setPageSize, toggleAutoRefresh } = useDosaggiTableStore();
```

Aggiornare la chiamata al hook:
```ts
const { data: result, isLoading, error } = useDosaggi(sortBy, sortOrder, currentPage, pageSize, "", autoRefresh ? 3000 : false);
```

Aggiungere l'icona `RefreshCw` agli import lucide:
```ts
import { Eye, EyeOff, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
```

Aggiungere il pulsante toggle nella toolbar (accanto al pulsante Espandi/Riduci, riga ~101):
```tsx
<div className="flex items-center justify-between border-b border-gray-200 pb-3 flex-shrink-0">
  <h2 className="text-lg font-semibold text-gray-900">Dosaggi</h2>
  <div className="flex items-center gap-2">
    <button
      onClick={toggleAutoRefresh}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-2 rounded transition-all text-sm font-medium",
        autoRefresh
          ? "bg-green-600 text-white hover:bg-green-700"
          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
      )}
      title={autoRefresh ? "Disattiva aggiornamento automatico" : "Attiva aggiornamento automatico (3s)"}
    >
      <RefreshCw className={clsx("w-4 h-4", autoRefresh && "animate-spin")} />
      <span>{autoRefresh ? "Auto ON" : "Auto OFF"}</span>
    </button>
    <button
      onClick={toggleSecondaryColumns}
      ...
    >
```

- [ ] **Step 4: Aggiungere il toggle in `OrdiniTable`**

In `features/ordini/OrdiniTable.tsx`:

Aggiungere `RefreshCw` agli import lucide:
```ts
import { ChevronLeft, ChevronRight, Settings, Archive, ArchiveRestore, RefreshCw } from "lucide-react";
```

Aggiungere `AutoRefreshToggle` come nuovo componente esportato (dopo `ArchivedToggle`):
```tsx
export function AutoRefreshToggle() {
  const { autoRefresh, toggleAutoRefresh } = useOrdiniTableStore();

  return (
    <button
      onClick={toggleAutoRefresh}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
        autoRefresh
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      )}
      title={autoRefresh ? "Disattiva aggiornamento automatico" : "Attiva aggiornamento automatico (3s)"}
    >
      <RefreshCw className={clsx("w-4 h-4", autoRefresh && "animate-spin")} />
      {autoRefresh ? "Auto ON" : "Auto OFF"}
    </button>
  );
}
```

In `OrdiniTableContent`, aggiornare la chiamata a `useOrdini`:
```ts
const { sortBy, sortOrder, currentPage, setCurrentPage, pageSize, setPageSize, setSortBy, showArchived, autoRefresh } = useOrdiniTableStore();
const { data, isLoading, error } = useOrdini(sortBy, sortOrder, currentPage, pageSize, showArchived, autoRefresh ? 3000 : false);
```

In fondo al file, registrare il nuovo componente sul namespace:
```ts
OrdiniTable.ColumnToggle = ColumnToggle;
OrdiniTable.ArchivedToggle = ArchivedToggle;
OrdiniTable.AutoRefreshToggle = AutoRefreshToggle;  // NEW
```

- [ ] **Step 5: Usare `AutoRefreshToggle` nella pagina Ordini**

Trovare `app/ordini/page.tsx` (o il componente wrapper che monta `OrdiniTable`) e aggiungere `<OrdiniTable.AutoRefreshToggle />` nella toolbar, accanto agli altri toggle.

- [ ] **Step 6: Verificare visivamente**

- Aprire la pagina Dosaggi: cliccare "Auto OFF" → diventa "Auto ON" verde con icona rotante. Ogni 3 secondi la tabella si aggiorna (verificabile con Network tab del browser).
- Aprire la pagina Ordini: stesso comportamento.

- [ ] **Step 7: Commit**

```bash
git add hooks/useDosaggi.ts hooks/useOrdini.ts features/dosaggi/DosaggiTable.tsx features/ordini/OrdiniTable.tsx
git commit -m "feat: toggle auto-refresh 3s per tabelle Dosaggi e Ordini"
```

---

## Task 5: Filtro Codice Manufatto — Server e Store

**Files:**
- Modify: `server/dosaggi.ts`
- Modify: `hooks/useDosaggiTableStore.ts`

- [ ] **Step 1: Aggiungere `codManFilter` all'interfaccia del server action**

In `server/dosaggi.ts`, aggiornare `GetDosaggiOptions`:

```ts
interface GetDosaggiOptions {
  sortBy?: DosaggiSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  codManFilter?: string;
}
```

Aggiornare la funzione per usare il filtro:

```ts
export async function getDosaggi(options: GetDosaggiOptions = {}): Promise<GetDosaggiResult> {
  const {
    sortBy = "data",
    sortOrder = "desc",
    page = 1,
    pageSize = 10,
    codManFilter = "",
  } = options;

  const validFields = ["id", "data", "timestampCiclo", "codMan", "codFor", "temperat", "umidita", "timeTotal"];
  const safeSortBy = validFields.includes(sortBy) ? sortBy : "data";

  const offset = Math.max(0, (page - 1) * pageSize);

  const where = codManFilter
    ? { codMan: { contains: codManFilter, mode: "insensitive" as const } }
    : {};

  const total = await prisma.dosaggio.count({ where });

  const dosaggi = await prisma.dosaggio.findMany({
    where,
    orderBy: { [safeSortBy]: sortOrder },
    skip: offset,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return { dosaggi: dosaggi as DosaggioDTO[], total, page, pageSize, totalPages };
}
```

- [ ] **Step 2: Aggiungere `codManFilter` al DosaggiTableStore**

In `hooks/useDosaggiTableStore.ts`, aggiungere all'interfaccia:

```ts
codManFilter: string;
setCodManFilter: (value: string) => void;
```

Nel corpo:

```ts
codManFilter: "",

setCodManFilter: (value: string) =>
  set(() => ({ codManFilter: value, currentPage: 1 })),
```

`codManFilter` **non** va in `partialize` (si azzera al ricaricamento, comportamento desiderato).

- [ ] **Step 3: Commit**

```bash
git add server/dosaggi.ts hooks/useDosaggiTableStore.ts
git commit -m "feat: filtro codMan server-side per tabella Dosaggi"
```

---

## Task 6: Filtro Codice Manufatto — UI

**Files:**
- Modify: `features/dosaggi/DosaggiTable.tsx`

- [ ] **Step 1: Collegare `codManFilter` nella tabella**

In `features/dosaggi/DosaggiTable.tsx`:

Aggiornare il destructuring dallo store:
```ts
const { sortBy, sortOrder, showSecondaryColumns, currentPage, pageSize,
        autoRefresh, codManFilter,
        setSortBy, toggleSecondaryColumns, setCurrentPage,
        setPageSize, toggleAutoRefresh, setCodManFilter } = useDosaggiTableStore();
```

Aggiornare la chiamata al hook (passare `codManFilter`):
```ts
const { data: result, isLoading, error } = useDosaggi(
  sortBy, sortOrder, currentPage, pageSize, codManFilter, autoRefresh ? 3000 : false
);
```

- [ ] **Step 2: Aggiungere input di ricerca nella toolbar**

Aggiungere sotto il div `flex items-center justify-between` della toolbar, prima della tabella, un secondo div per il filtro:

```tsx
{/* Barra filtri */}
<div className="flex items-center gap-3 py-2 flex-shrink-0">
  <div className="relative">
    <input
      type="text"
      placeholder="Filtra per Manufatto..."
      value={codManFilter}
      onChange={(e) => setCodManFilter(e.target.value)}
      className="pl-3 pr-8 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-52"
    />
    {codManFilter && (
      <button
        onClick={() => setCodManFilter("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        title="Cancella filtro"
      >
        ×
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 3: Verificare visivamente**

Digitare un codice manufatto nel campo di ricerca → la tabella si aggiorna mostrando solo le righe corrispondenti. Cancellare il testo → la tabella torna a mostrare tutti i record.

- [ ] **Step 4: Commit**

```bash
git add features/dosaggi/DosaggiTable.tsx
git commit -m "feat: input filtro Manufatto nella tabella Dosaggi"
```

---

## Checklist Finale

- [ ] Colonne Dosaggi mostrano i nuovi nomi (N. Stazione, Manufatto, Formula, Metri Cubi M³, Temperatura, Tempo Totale)
- [ ] Form "Crea Nuovo Ordine" apre con Igrometro=NO e Avvio=Manuale
- [ ] Toggle Auto-refresh su pagina Dosaggi funziona (verde/animato quando ON, poll ogni 3s)
- [ ] Toggle Auto-refresh su pagina Ordini funziona
- [ ] Filtro Manufatto filtra la tabella Dosaggi e resetta a pagina 1
- [ ] Pulsante × nel filtro azzera la ricerca
- [ ] Build senza errori TypeScript: `npm run build`
