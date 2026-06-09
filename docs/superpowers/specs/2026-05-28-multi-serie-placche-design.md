# Design: Multi-Serie Placche in Nuova Produzione

**Data:** 2026-05-28  
**Progetto:** agrinascente-traceability  
**File principale:** `src/components/modals/NewProductionModal.tsx`

---

## Problema

Quando un utente deve registrare forme prodotte su più serie di placche (es. serie A e serie B), oggi è costretto a creare due "produzioni" separate, ripetendo articolo e KG. L'obiettivo è eliminare questa ripetizione.

---

## Soluzione: Opzione A — Righe inline nella card produzione

### Principio

L'UI mostra una sola card produzione con una mini-tabella di range placche. Il DB non cambia struttura: ogni range genera un record produzione separato, esattamente come oggi. La semplificazione è esclusivamente nella UI.

---

## Data Model (frontend only)

Aggiunta di `PlateRange` e campo `plateRanges` in `ProductionItem`:

```typescript
// src/types/produzione.ts

interface PlateRange {
  id: string       // chiave React (uuid locale)
  series: string   // es. "A"
  from: string     // numero placca iniziale
  to: string       // numero placca finale
}

interface ProductionItem {
  // campi esistenti invariati ...
  plateRanges?: PlateRange[]   // NUOVO — solo per articoli FFPRSALE
  // campi legacy mantenuti per compatibilità edit mode e DB esistente:
  plateSeries?: string
  plateNumberFrom?: string
  plateNumberTo?: string
}
```

I campi legacy (`plateSeries`, `plateNumberFrom`, `plateNumberTo`) **non vengono rimossi** dal tipo né dal DB. Servono per:
- Inizializzare `plateRanges` in edit mode (1 range per record esistente)
- Compatibilità con codice non ancora migrato

---

## Comportamento UI

### Per articoli FFPRSALE

Il campo `Pezzi (n°)` diventa **read-only e auto-calcolato**:
- Valore = somma di `(to − from + 1)` su tutti i range presenti
- Sfondo grigio per segnalare che è derivato
- Rimane visibile nella posizione attuale

La sezione placche mostra una mini-tabella inline:

```
[Articolo ▾]      [Pezzi: 12 (auto, grigio)]   [Kg _____]

  Serie   Da    A      N°
  [A   ] [  1] [  6]   6   [×]
  [B   ] [  1] [  6]   6   [×]
                      ────
              Totale: 12    [+ Aggiungi serie]
```

**Colonne:**
| Campo | Tipo | Comportamento |
|-------|------|---------------|
| Serie | Input testo | Auto-uppercase, max 5 car. Quando modificata: fetch `lastPlateNumber(series)` → auto-fill `Da = last+1` |
| Da | Input number | Modificabile manualmente, min 1 max 1000 |
| A | Input number | Modificabile manualmente, min 1 max 1000 |
| N° | Display read-only | `A − Da + 1`, oppure `—` se Da/A non validi |
| [×] | Button | Rimuove il range. Visibile solo se ci sono 2+ righe |

**Auto-fill `A` all'inserimento serie:**
- `remaining = production.pieces_totale − somma_pezzi_altri_range`
- `A = Da + remaining − 1` (capped a 1000)
- Se `remaining ≤ 0`: `A = Da`

**[+ Aggiungi serie]:** aggiunge una riga vuota. Nessun auto-fill finché l'utente non scrive la serie.

**Totale nel footer:** somma in tempo reale di tutti i range `N°`.

**Warning limite 1000:** se `A = 1000` per un range, mostra avviso sotto quella riga (come oggi).

### Per articoli non FFPRSALE

Nessun cambiamento. `Pezzi (n°)` rimane manuale e le placche non appaiono.

### Header card produzione

Il titolo "Produzione 1", "Produzione N" viene reso più prominente:
- Font `text-base font-bold` (attualmente `font-medium`)
- Sfondo pill/badge colorato (es. `bg-blue-100 text-blue-800 px-3 py-1 rounded-full`)

---

## Submit Logic

### Espansione range → record DB

Prima di inviare le API call, ogni `ProductionItem` con `plateRanges` viene espanso:

```
ProductionItem con plateRanges [A:1→6, B:1→6], kg=200
  → record 1: { forms:6, plateSeries:"A", from:1, to:6, milkKg:100 }
  → record 2: { forms:6, plateSeries:"B", from:1, to:6, milkKg:100 }
```

**Ripartizione KG:** proporzionale al numero di forme di ogni range rispetto al totale (`milkKg = totalMilkKg × forms_range / forms_totale`). Identico alla logica già esistente per produzioni multiple.

**Caso 1 range:** comportamento identico a oggi (nessuna espansione necessaria).

**Caso 0 range (FFPRSALE senza placche):** l'item viene inviato così com'è, con `plateSeries = null`.

### Edit mode

In edit mode, `plateRanges` viene inizializzato dai campi legacy:
```typescript
plateRanges: prod.plateSeries
  ? [{ id: `range-init-${prod.id}`, series: prod.plateSeries, from: prod.plateNumberFrom ?? '', to: prod.plateNumberTo ?? '' }]
  : []
```

L'UI è identica alla modalità new — con 1 riga pre-compilata. L'utente può aggiungere range aggiuntivi: quelli extra diventano nuovi record (POST), il range originale aggiorna il record esistente (PUT).

---

## File coinvolti

| File | Tipo di modifica |
|------|-----------------|
| `src/types/produzione.ts` | Aggiunta `PlateRange` interface + campo `plateRanges` su `ProductionItem` |
| `src/components/modals/NewProductionModal.tsx` | UI section placche, funzioni gestione range, logica submit/edit |

---

## Fuori scope

- Modifica struttura DB o API
- Multi-range per articoli diversi da FFPRSALE
- Validazione che il totale forme corrisponda a un valore atteso (solo display, nessun blocco)
