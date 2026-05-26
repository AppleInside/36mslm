# Anagrafiche Articoli e Magazzini - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere tab Articoli e Magazzini alla pagina /anagrafiche con CRUD completo.

**Architecture:** La pagina /anagrafiche diventa un container a 3 tab (shadcn Tabs). ArticoliTab e MagazziniTab sono componenti autonomi che replicano il pattern CRUD della pagina esistente. Le API Articoli sono nuove; le API Magazzini esistenti vengono aggiornate per supportare paginazione e campi indirizzo senza rompere la mappa esistente.

**Tech Stack:** Next.js 14 App Router, Prisma (aNAGR_Articoli, ANAGR_Magazzini), shadcn/ui (Tabs, Button, Input, Dialog), TypeScript, Tailwind CSS

---

## File Map

| Operazione | File |
|-----------|------|
| Crea | `src/components/ui/tabs.tsx` (shadcn install) |
| Crea | `src/types/articoli.ts` |
| Modifica | `src/types/magazzino.ts` |
| Crea | `src/app/api/articoli/route.ts` |
| Crea | `src/app/api/articoli/[id]/route.ts` |
| Modifica | `src/app/api/magazzini/route.ts` |
| Modifica | `src/app/api/magazzini/[id]/route.ts` |
| Crea | `src/components/modals/ArticoloModal.tsx` |
| Crea | `src/components/modals/MagazzinoModal.tsx` |
| Crea | `src/components/anagrafiche/tabs/ArticoliTab.tsx` |
| Crea | `src/components/anagrafiche/tabs/MagazziniTab.tsx` |
| Modifica | `src/app/anagrafiche/page.tsx` |

---

### Task 1: Installa shadcn Tabs e crea tipi TypeScript

**Files:**
- Create: `src/components/ui/tabs.tsx`
- Create: `src/types/articoli.ts`
- Modify: `src/types/magazzino.ts`

- [ ] **Step 1: Installa il componente Tabs da shadcn**

```bash
npx shadcn@latest add tabs
```
Expected: crea `src/components/ui/tabs.tsx` con export di `Tabs, TabsList, TabsTrigger, TabsContent`

- [ ] **Step 2: Crea `src/types/articoli.ts`**

```typescript
export interface Articolo {
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

- [ ] **Step 3: Aggiungi `Magazzino` in fondo a `src/types/magazzino.ts`**

```typescript
export interface Magazzino {
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

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tabs.tsx src/types/articoli.ts src/types/magazzino.ts
git commit -m "feat: aggiungi shadcn Tabs e tipi Articolo/Magazzino"
```

---

### Task 2: API Articoli

**Files:**
- Create: `src/app/api/articoli/route.ts`
- Create: `src/app/api/articoli/[id]/route.ts`

- [ ] **Step 1: Crea `src/app/api/articoli/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const selectFields = {
  id: true, articleCode: true, name: true, description: true,
  units: true, defaultWeight: true, tags: true, createdAt: true, updatedAt: true,
}

// Prisma Decimal → number, Date → string
const toArticolo = (a: {
  id: string; articleCode: string; name: string; description: string | null;
  units: string[]; defaultWeight: unknown; tags: string[];
  createdAt: Date; updatedAt: Date;
}) => ({
  ...a,
  defaultWeight: a.defaultWeight != null ? Number(a.defaultWeight) : null,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const take = searchParams.get('take') ? parseInt(searchParams.get('take')!) : undefined
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { articleCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.aNAGR_Articoli.count({ where })
    const articoli = await prisma.aNAGR_Articoli.findMany({
      where, orderBy: { name: 'asc' }, take, skip, select: selectFields,
    })

    return NextResponse.json({ data: articoli.map(toArticolo), total })
  } catch (error) {
    console.error('Errore nel recupero articoli:', error)
    return NextResponse.json({ error: 'Errore nel recupero degli articoli' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.articleCode?.trim()) {
      return NextResponse.json({ error: 'Il codice articolo è obbligatorio' }, { status: 400 })
    }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    const existing = await prisma.aNAGR_Articoli.findUnique({
      where: { articleCode: body.articleCode.trim() },
    })
    if (existing) {
      return NextResponse.json({ error: 'Questo codice articolo è già in uso' }, { status: 409 })
    }

    const articolo = await prisma.aNAGR_Articoli.create({
      data: {
        articleCode: body.articleCode.trim(),
        name: body.name.trim(),
        description: body.description || null,
        units: body.units?.length ? body.units : ['kg'],
        defaultWeight: body.defaultWeight != null ? parseFloat(body.defaultWeight) : null,
        tags: body.tags || [],
      },
      select: selectFields,
    })

    return NextResponse.json(toArticolo(articolo), { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione articolo:', error)
    return NextResponse.json({ error: "Errore nella creazione dell'articolo" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Crea `src/app/api/articoli/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const selectFields = {
  id: true, articleCode: true, name: true, description: true,
  units: true, defaultWeight: true, tags: true, createdAt: true, updatedAt: true,
}

const toArticolo = (a: {
  id: string; articleCode: string; name: string; description: string | null;
  units: string[]; defaultWeight: unknown; tags: string[];
  createdAt: Date; updatedAt: Date;
}) => ({
  ...a,
  defaultWeight: a.defaultWeight != null ? Number(a.defaultWeight) : null,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const articolo = await prisma.aNAGR_Articoli.findUnique({ where: { id }, select: selectFields })
    if (!articolo) {
      return NextResponse.json({ error: 'Articolo non trovato' }, { status: 404 })
    }
    return NextResponse.json(toArticolo(articolo))
  } catch (error) {
    console.error('Errore nel recupero articolo:', error)
    return NextResponse.json({ error: "Errore nel recupero dell'articolo" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await prisma.aNAGR_Articoli.update({
      where: { id },
      data: {
        articleCode: body.articleCode !== undefined ? body.articleCode : undefined,
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        units: body.units !== undefined ? body.units : undefined,
        defaultWeight: body.defaultWeight !== undefined
          ? (body.defaultWeight != null ? parseFloat(body.defaultWeight) : null)
          : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
      },
      select: selectFields,
    })

    return NextResponse.json(toArticolo(updated))
  } catch (error) {
    console.error("Errore nell'aggiornamento articolo:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento dell'articolo" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const movementCount = await prisma.warehouseMovement.count({ where: { articleId: id } })
    if (movementCount > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ci sono ${movementCount} moviment${movementCount === 1 ? 'o' : 'i'} di magazzino associat${movementCount === 1 ? 'o' : 'i'}` },
        { status: 400 }
      )
    }

    await prisma.aNAGR_Articoli.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore nell'eliminazione articolo:", error)
    return NextResponse.json({ error: "Errore nell'eliminazione dell'articolo" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verifica build**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/articoli/
git commit -m "feat: aggiungi API CRUD articoli"
```

---

### Task 3: Aggiorna API Magazzini

**Files:**
- Modify: `src/app/api/magazzini/route.ts`
- Modify: `src/app/api/magazzini/[id]/route.ts`

- [ ] **Step 1: Riscrivi `src/app/api/magazzini/route.ts`**

Il GET esistente restituisce solo `active: true` senza paginazione. La nuova versione aggiunge la modalità CRUD (quando `take` è presente) preservando il comportamento originale per la mappa.

```typescript
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const coordinateMock: Record<string, { lat: number; lng: number }> = {
  'Magazzino Produzione Fresco': { lat: 44.8015, lng: 10.3279 },
  'Magazzino Centrale': { lat: 44.8049, lng: 10.3292 },
  'Magazzini AC snc Roncole Verdi': { lat: 44.6947, lng: 10.6309 },
  'PAC SERVICE FORMAGGI VIA PUCCI': { lat: 44.8097, lng: 10.3187 },
  'INTERGRANA VIA NENNI 20 FONTAN': { lat: 44.7234, lng: 10.6890 },
  'SARCA SRL': { lat: 44.7788, lng: 10.2876 },
  'PLAC - FATTORIE CREMONA - STAB': { lat: 44.8203, lng: 10.3456 },
  'Produzione': { lat: 44.8012, lng: 10.3301 },
  'Conto Visione': { lat: 44.8087, lng: 10.3234 },
  'MAGAZZINI GENERALI GORRARA': { lat: 44.7654, lng: 10.2987 },
  'MAGAZZINI CONSORZIO AGRARIO TE': { lat: 44.8156, lng: 10.3412 },
  'Fornitori Terzisti': { lat: 44.7890, lng: 10.3123 },
  'Magazzino Negozio Soragna': { lat: 44.9287, lng: 10.1174 },
  'Magazzino Negozio Fidenza': { lat: 44.8639, lng: 10.0587 },
  'Magazzino PEGNI SARTORI': { lat: 44.8234, lng: 10.3567 },
  'MAGAZZINO PEGNO GORRARA': { lat: 44.7687, lng: 10.2945 },
  'Magazzino Bertelli x Porzionat': { lat: 44.8145, lng: 10.3398 },
  'COLLA SPA - MAGAZZINO DI STAGI': { lat: 44.7945, lng: 10.3167 },
  'MAGAZZINI DOVANI MATTEO S.R.L.': { lat: 44.8076, lng: 10.3245 },
  'MAG. SPACCIO FIDENZA': { lat: 44.8632, lng: 10.0601 },
  'Magazzino PEGNI FIDENZA': { lat: 44.8654, lng: 10.0578 },
  'MAGAZZINI GENERALI GE.MA': { lat: 44.7823, lng: 10.3089 },
  'MAGAZZINO IMBALLI': { lat: 44.8089, lng: 10.3278 },
  'Magazzino Latte': { lat: 44.8023, lng: 10.3312 },
  'Magazzino Porzionatura spacci': { lat: 44.8067, lng: 10.3256 },
  'Magazzino SFRIDO NON IDONEO': { lat: 44.8034, lng: 10.3289 },
  'MAGAZZINO MATERIE PRIME': { lat: 44.8045, lng: 10.3267 },
  'Magazzino PANNA': { lat: 44.8056, lng: 10.3245 },
  'MAGAZZINO PEGNI A.C.': { lat: 44.8078, lng: 10.3223 },
  'Magazzino PEGNI COLLA': { lat: 44.7967, lng: 10.3178 },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const take = searchParams.get('take')
    const skip = searchParams.get('skip')
    const search = searchParams.get('search')

    // CRUD mode: paginazione, tutti gli stati
    if (take !== null) {
      const where: Record<string, unknown> = {}
      if (search) {
        where.OR = [
          { magCode: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ]
      }
      const total = await prisma.aNAGR_Magazzini.count({ where })
      const magazzini = await prisma.aNAGR_Magazzini.findMany({
        where,
        orderBy: { description: 'asc' },
        take: parseInt(take),
        skip: skip ? parseInt(skip) : undefined,
      })
      return NextResponse.json({ data: magazzini, total })
    }

    // Map mode: solo attivi, con coordinate mock
    const magazzini = await prisma.aNAGR_Magazzini.findMany({
      where: search
        ? { description: { contains: search, mode: 'insensitive' }, active: true }
        : { active: true },
      orderBy: { description: 'asc' },
    })

    const magazziniConCoordinate = magazzini.map((magazzino) => ({
      ...magazzino,
      coordinates: coordinateMock[magazzino.description] || {
        lat: 44.8015 + (Math.random() - 0.5) * 0.1,
        lng: 10.3279 + (Math.random() - 0.5) * 0.1,
      },
    }))

    return NextResponse.json(magazziniConCoordinate)
  } catch (error) {
    console.error('Errore nel caricamento magazzini:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'La descrizione è obbligatoria' }, { status: 400 })
    }

    if (body.magCode?.trim()) {
      const existing = await prisma.aNAGR_Magazzini.findUnique({
        where: { magCode: body.magCode.trim() },
      })
      if (existing) {
        return NextResponse.json({ error: 'Questo codice è già in uso' }, { status: 409 })
      }
    }

    if (body.latitude != null) {
      const lat = parseFloat(body.latitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Latitudine non valida (da -90 a 90)' }, { status: 400 })
      }
    }
    if (body.longitude != null) {
      const lng = parseFloat(body.longitude)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Longitudine non valida (da -180 a 180)' }, { status: 400 })
      }
    }

    const magazzino = await prisma.aNAGR_Magazzini.create({
      data: {
        description: body.description.trim(),
        magCode: body.magCode?.trim() || null,
        name: body.name?.trim() || null,
        address: body.address?.trim() || null,
        postalCode: body.postalCode?.trim() || null,
        city: body.city?.trim() || null,
        province: body.province?.trim() || null,
        country: body.country?.trim() || null,
        latitude: body.latitude != null ? parseFloat(body.latitude) : null,
        longitude: body.longitude != null ? parseFloat(body.longitude) : null,
        internal: body.internal ?? false,
        active: body.active ?? true,
      },
    })

    return NextResponse.json(magazzino, { status: 201 })
  } catch (error) {
    console.error('Errore nella creazione magazzino:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Aggiungi handler PATCH in `src/app/api/magazzini/[id]/route.ts`**

Aggiungere questo blocco alla fine del file esistente (dopo il DELETE):

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.latitude != null) {
      const lat = typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Latitudine non valida (da -90 a 90)' }, { status: 400 })
      }
    }
    if (body.longitude != null) {
      const lng = typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Longitudine non valida (da -180 a 180)' }, { status: 400 })
      }
    }

    const updated = await prisma.aNAGR_Magazzini.update({
      where: { id },
      data: {
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        magCode: body.magCode !== undefined ? (body.magCode?.trim() || null) : undefined,
        name: body.name !== undefined ? (body.name?.trim() || null) : undefined,
        address: body.address !== undefined ? (body.address?.trim() || null) : undefined,
        postalCode: body.postalCode !== undefined ? (body.postalCode?.trim() || null) : undefined,
        city: body.city !== undefined ? (body.city?.trim() || null) : undefined,
        province: body.province !== undefined ? (body.province?.trim() || null) : undefined,
        country: body.country !== undefined ? (body.country?.trim() || null) : undefined,
        internal: body.internal !== undefined ? body.internal : undefined,
        active: body.active !== undefined ? body.active : undefined,
        latitude: body.latitude !== undefined
          ? (body.latitude != null ? parseFloat(String(body.latitude)) : null)
          : undefined,
        longitude: body.longitude !== undefined
          ? (body.longitude != null ? parseFloat(String(body.longitude)) : null)
          : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Errore nell'aggiornamento magazzino:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento del magazzino" }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verifica build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/magazzini/
git commit -m "feat: aggiorna API magazzini per CRUD con paginazione e campi indirizzo"
```

---

### Task 4: Modal Articolo

**Files:**
- Create: `src/components/modals/ArticoloModal.tsx`

- [ ] **Step 1: Crea `src/components/modals/ArticoloModal.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Tag, Loader2, PackagePlus, Edit3 } from "lucide-react";
import type { Articolo } from "@/types/articoli";

interface ArticoloFormData {
  articleCode: string;
  name: string;
  description: string;
  units: string;
  defaultWeight: string;
  tags: string;
}

const emptyFormData: ArticoloFormData = {
  articleCode: "",
  name: "",
  description: "",
  units: "kg",
  defaultWeight: "",
  tags: "",
};

interface ArticoloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editItem?: Articolo | null;
}

export default function ArticoloModal({
  isOpen,
  onClose,
  onSave,
  editItem,
}: ArticoloModalProps) {
  const [formData, setFormData] = useState<ArticoloFormData>(emptyFormData);
  const [originalData, setOriginalData] = useState<ArticoloFormData>(emptyFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editItem;
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const toStr = (v: string | null | undefined, fallback = "") =>
    !v || v === "NULL" || v === "null" ? fallback : v;

  useEffect(() => {
    if (editItem) {
      const populated: ArticoloFormData = {
        articleCode: toStr(editItem.articleCode),
        name: toStr(editItem.name),
        description: toStr(editItem.description),
        units: editItem.units?.join(", ") || "kg",
        defaultWeight: editItem.defaultWeight != null ? String(editItem.defaultWeight) : "",
        tags: editItem.tags?.join(", ") || "",
      };
      setFormData(populated);
      setOriginalData(populated);
    } else {
      setFormData(emptyFormData);
      setOriginalData(emptyFormData);
    }
    setError(null);
  }, [editItem, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseArray = (s: string) =>
    s.split(",").map((v) => v.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.articleCode.trim()) {
      setError("Il codice articolo è obbligatorio");
      setLoading(false);
      return;
    }
    if (!formData.name.trim()) {
      setError("Il nome è obbligatorio");
      setLoading(false);
      return;
    }

    try {
      const url = isEditMode ? `/api/articoli/${editItem!.id}` : "/api/articoli";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleCode: formData.articleCode.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          units: parseArray(formData.units).length > 0 ? parseArray(formData.units) : ["kg"],
          defaultWeight: formData.defaultWeight.trim()
            ? parseFloat(formData.defaultWeight)
            : null,
          tags: parseArray(formData.tags),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Errore durante il salvataggio");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {isEditMode ? (
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit3 className="h-6 w-6 text-blue-600" />
              </div>
            ) : (
              <div className="p-2 bg-green-100 rounded-lg">
                <PackagePlus className="h-6 w-6 text-green-600" />
              </div>
            )}
            <span>{isEditMode ? "Modifica Articolo" : "Nuovo Articolo"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Dati Principali */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Package className="h-4 w-4" />
              Dati Principali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice *</label>
                <Input
                  name="articleCode"
                  value={formData.articleCode}
                  onChange={handleChange}
                  placeholder="ART001"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome articolo"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* Dettagli */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Package className="h-4 w-4" />
              Dettagli
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Descrizione articolo..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unità di misura
                  </label>
                  <Input
                    name="units"
                    value={formData.units}
                    onChange={handleChange}
                    placeholder="kg, pz, l"
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate da virgola</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso default (kg)
                  </label>
                  <Input
                    name="defaultWeight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaultWeight}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tag */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4" />
              Tag
            </h3>
            <Input
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="tag1, tag2, tag3"
              className="bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Separati da virgola</p>
          </div>

          {/* Bottoni */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || (isEditMode && !hasChanges)}
              className={`text-white ${isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : isEditMode ? (
                "Salva"
              ) : (
                "Crea Articolo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/ArticoloModal.tsx
git commit -m "feat: aggiungi modal articolo"
```

---

### Task 5: Modal Magazzino

**Files:**
- Create: `src/components/modals/MagazzinoModal.tsx`

- [ ] **Step 1: Crea `src/components/modals/MagazzinoModal.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Warehouse, MapPin, Navigation, Loader2 } from "lucide-react";
import type { Magazzino } from "@/types/magazzino";

interface MagazzinoFormData {
  magCode: string;
  name: string;
  description: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  internal: boolean;
  latitude: string;
  longitude: string;
  active: boolean;
}

const emptyFormData: MagazzinoFormData = {
  magCode: "",
  name: "",
  description: "",
  address: "",
  postalCode: "",
  city: "",
  province: "",
  country: "Italia",
  internal: false,
  latitude: "",
  longitude: "",
  active: true,
};

interface MagazzinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editItem?: Magazzino | null;
}

export default function MagazzinoModal({
  isOpen,
  onClose,
  onSave,
  editItem,
}: MagazzinoModalProps) {
  const [formData, setFormData] = useState<MagazzinoFormData>(emptyFormData);
  const [originalData, setOriginalData] = useState<MagazzinoFormData>(emptyFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editItem;
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const toStr = (v: string | null | undefined, fallback = "") =>
    !v || v === "NULL" || v === "null" ? fallback : v;

  useEffect(() => {
    if (editItem) {
      const populated: MagazzinoFormData = {
        magCode: toStr(editItem.magCode),
        name: toStr(editItem.name),
        description: toStr(editItem.description),
        address: toStr(editItem.address),
        postalCode: toStr(editItem.postalCode),
        city: toStr(editItem.city),
        province: toStr(editItem.province),
        country: toStr(editItem.country, "Italia"),
        internal: editItem.internal ?? false,
        latitude: editItem.latitude != null ? String(editItem.latitude) : "",
        longitude: editItem.longitude != null ? String(editItem.longitude) : "",
        active: editItem.active,
      };
      setFormData(populated);
      setOriginalData(populated);
    } else {
      setFormData(emptyFormData);
      setOriginalData(emptyFormData);
    }
    setError(null);
  }, [editItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.description.trim()) {
      setError("La descrizione è obbligatoria");
      setLoading(false);
      return;
    }

    try {
      const url = isEditMode ? `/api/magazzini/${editItem!.id}` : "/api/magazzini";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          magCode: formData.magCode.trim() || null,
          name: formData.name.trim() || null,
          description: formData.description.trim(),
          address: formData.address.trim() || null,
          postalCode: formData.postalCode.trim() || null,
          city: formData.city.trim() || null,
          province: formData.province.trim() || null,
          country: formData.country.trim() || null,
          internal: formData.internal,
          latitude: formData.latitude.trim() ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude.trim() ? parseFloat(formData.longitude) : null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Errore durante il salvataggio");
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg ${isEditMode ? "bg-blue-100" : "bg-green-100"}`}>
              <Warehouse className={`h-6 w-6 ${isEditMode ? "text-blue-600" : "text-green-600"}`} />
            </div>
            <span>{isEditMode ? "Modifica Magazzino" : "Nuovo Magazzino"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Dati Principali */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Warehouse className="h-4 w-4" />
              Dati Principali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice</label>
                <Input name="magCode" value={formData.magCode} onChange={handleChange} placeholder="MAG001" className="bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nome breve" className="bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                <Input name="description" value={formData.description} onChange={handleChange} placeholder="Descrizione magazzino" className="bg-white" />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="internal"
                  checked={formData.internal}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Magazzino Interno</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Attivo</span>
              </label>
            </div>
          </div>

          {/* Indirizzo */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              Indirizzo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Via/Piazza</label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Via/Piazza..." className="bg-white" />
              </div>
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                  <Input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="00000" maxLength={5} className="bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                  <Input name="city" value={formData.city} onChange={handleChange} placeholder="Città" className="bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <Input name="province" value={formData.province} onChange={handleChange} placeholder="PR" maxLength={2} className="bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paese</label>
                <Input name="country" value={formData.country} onChange={handleChange} placeholder="Italia" className="bg-white" />
              </div>
            </div>
          </div>

          {/* Coordinate GPS */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
            <h3 className="text-sm font-semibold text-orange-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Navigation className="h-4 w-4" />
              Coordinate GPS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitudine</label>
                <Input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="44.8015" className="bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitudine</label>
                <Input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="10.3279" className="bg-white" />
              </div>
            </div>
          </div>

          {/* Bottoni */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || (isEditMode && !hasChanges)}
              className={`text-white ${isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : isEditMode ? (
                "Salva"
              ) : (
                "Crea Magazzino"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/MagazzinoModal.tsx
git commit -m "feat: aggiungi modal magazzino"
```

---

### Task 6: Tab Articoli

**Files:**
- Create: `src/components/anagrafiche/tabs/ArticoliTab.tsx`

- [ ] **Step 1: Crea `src/components/anagrafiche/tabs/ArticoliTab.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Package, Search, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ArticoloModal from "@/components/modals/ArticoloModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/toast-container";
import type { Articolo } from "@/types/articoli";

const ITEMS_PER_PAGE = 20;

export default function ArticoliTab() {
  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Articolo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Articolo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toasts, removeToast, success, error } = useToast();

  const fetchArticoli = useCallback(
    async (reset = true) => {
      try {
        reset ? setLoading(true) : setLoadingMore(true);
        const skip = reset ? 0 : articoli.length;
        const params = new URLSearchParams({
          take: ITEMS_PER_PAGE.toString(),
          skip: skip.toString(),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const response = await fetch(`/api/articoli?${params}`);
        if (response.ok) {
          const result = await response.json();
          setTotal(result.total);
          if (reset) {
            setArticoli(result.data);
          } else {
            setArticoli((prev) => [...prev, ...result.data]);
          }
          setHasMore(skip + result.data.length < result.total);
        }
      } catch {
        error("Errore nel caricamento degli articoli");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, articoli.length, error]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchArticoli(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/articoli/${itemToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Errore durante l'eliminazione");
      }
      success("Articolo eliminato con successo");
      fetchArticoli(true);
    } catch (err) {
      error(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca per codice, nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 px-4 py-2 h-9 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Articolo
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-4">Caricamento articoli...</p>
          </div>
        ) : articoli.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {debouncedSearch ? "Nessun articolo trovato" : "Nessun articolo presente"}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea il primo articolo
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Codice", "Nome", "Descrizione", "Unità", "Peso Default", "Tag", "Azioni"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Azioni" ? "text-center" : "text-left"}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articoli.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">{item.articleCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                        {item.description || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {item.units?.join(", ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {item.defaultWeight != null ? `${item.defaultWeight} kg` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.length > 0 ? (
                          item.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Modifica"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setItemToDelete(item); setShowDeleteConfirm(true); }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {articoli.length} di {total} articoli
            </p>
            {hasMore && (
              <Button
                onClick={() => fetchArticoli(false)}
                disabled={loadingMore}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</>
                ) : (
                  "Carica altri"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ArticoloModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={() => {
          success(editingItem ? "Articolo aggiornato" : "Articolo creato");
          fetchArticoli(true);
        }}
        editItem={editingItem}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Elimina Articolo"
        description={`Sei sicuro di voler eliminare l'articolo "${itemToDelete?.name}"? Questa azione non può essere annullata.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/anagrafiche/tabs/ArticoliTab.tsx
git commit -m "feat: aggiungi tab articoli"
```

---

### Task 7: Tab Magazzini

**Files:**
- Create: `src/components/anagrafiche/tabs/MagazziniTab.tsx`

- [ ] **Step 1: Crea `src/components/anagrafiche/tabs/MagazziniTab.tsx`**

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Warehouse, Search, Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MagazzinoModal from "@/components/modals/MagazzinoModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/toast-container";
import type { Magazzino } from "@/types/magazzino";

const ITEMS_PER_PAGE = 20;

export default function MagazziniTab() {
  const [magazzini, setMagazzini] = useState<Magazzino[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Magazzino | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Magazzino | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toasts, removeToast, success, error } = useToast();

  const fetchMagazzini = useCallback(
    async (reset = true) => {
      try {
        reset ? setLoading(true) : setLoadingMore(true);
        const skip = reset ? 0 : magazzini.length;
        const params = new URLSearchParams({
          take: ITEMS_PER_PAGE.toString(),
          skip: skip.toString(),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);

        const response = await fetch(`/api/magazzini?${params}`);
        if (response.ok) {
          const result = await response.json();
          setTotal(result.total);
          if (reset) {
            setMagazzini(result.data);
          } else {
            setMagazzini((prev) => [...prev, ...result.data]);
          }
          setHasMore(skip + result.data.length < result.total);
        }
      } catch {
        error("Errore nel caricamento dei magazzini");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, magazzini.length, error]
  );

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchMagazzini(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/magazzini/${itemToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Errore durante l'eliminazione");
      }
      success("Magazzino eliminato con successo");
      fetchMagazzini(true);
    } catch (err) {
      error(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca per codice, nome, città..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 px-4 py-2 h-9 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Magazzino
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-500 mt-4">Caricamento magazzini...</p>
          </div>
        ) : magazzini.length === 0 ? (
          <div className="p-12 text-center">
            <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {debouncedSearch ? "Nessun magazzino trovato" : "Nessun magazzino presente"}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crea il primo magazzino
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Codice", "Nome / Descrizione", "Città", "Tipo", "Stato", "Azioni"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Azioni" || h === "Stato" || h === "Tipo" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {magazzini.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600">
                        {item.magCode || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.name && (
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      )}
                      <div className={`text-sm ${item.name ? "text-gray-500" : "font-medium text-gray-900"}`}>
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {[item.city, item.province].filter(Boolean).join(", ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.internal
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {item.internal ? "Interno" : "Esterno"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3" />
                          Inattivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Modifica"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setItemToDelete(item); setShowDeleteConfirm(true); }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {magazzini.length} di {total} magazzini
            </p>
            {hasMore && (
              <Button
                onClick={() => fetchMagazzini(false)}
                disabled={loadingMore}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</>
                ) : (
                  "Carica altri"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <MagazzinoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={() => {
          success(editingItem ? "Magazzino aggiornato" : "Magazzino creato");
          fetchMagazzini(true);
        }}
        editItem={editingItem}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Elimina Magazzino"
        description={`Sei sicuro di voler eliminare il magazzino "${itemToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/anagrafiche/tabs/MagazziniTab.tsx
git commit -m "feat: aggiungi tab magazzini"
```

---

### Task 8: Integra tabs in `anagrafiche/page.tsx`

**Files:**
- Modify: `src/app/anagrafiche/page.tsx`

- [ ] **Step 1: Aggiungi import tabs e componenti in cima al file**

Dopo la riga `"use client";`, aggiornare gli import esistenti aggiungendo:

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ArticoliTab from "@/components/anagrafiche/tabs/ArticoliTab";
import MagazziniTab from "@/components/anagrafiche/tabs/MagazziniTab";
```

- [ ] **Step 2: Avvolgi il contenuto nel return con i Tabs**

Sostituire l'intera sezione `return` del componente. La struttura è:
- `<PageHeader>` rimane fuori dai tab
- `<div className="p-6">` diventa il container dei tab
- Il `<div className="bg-white rounded-lg border...">` esistente va dentro `<TabsContent value="clienti-fornitori">`

```typescript
  return (
    <>
      <PageHeader
        title="Anagrafiche"
        subtitle="Gestione clienti, fornitori, articoli e magazzini"
      />

      <div className="p-6">
        <Tabs defaultValue="clienti-fornitori">
          <TabsList className="mb-4">
            <TabsTrigger value="clienti-fornitori">Clienti / Fornitori / Vettori</TabsTrigger>
            <TabsTrigger value="articoli">Articoli</TabsTrigger>
            <TabsTrigger value="magazzini">Magazzini</TabsTrigger>
          </TabsList>

          <TabsContent value="clienti-fornitori">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* === TUTTO IL CONTENUTO ESISTENTE (Header, Content, Footer) === */}
              {/* Copia qui il blocco <div className="bg-white rounded-lg border..."> già presente */}
            </div>
          </TabsContent>

          <TabsContent value="articoli">
            <ArticoliTab />
          </TabsContent>

          <TabsContent value="magazzini">
            <MagazziniTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal e Toast esistenti rimangono invariati */}
      <AnagraficaModal ... />
      <ConfirmDialog ... />
      <ToastContainer ... />
    </>
  );
```

In pratica: avvolgi il `<div className="bg-white rounded-lg border border-gray-200 shadow-sm">` (righe 227-455 del file originale) dentro `<TabsContent value="clienti-fornitori">`, e sostituisci `<div className="p-6">` con il container Tabs sopra.

- [ ] **Step 3: Verifica build**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Verifica avvio**

```bash
npm run dev
```
Naviga su `http://localhost:3000/anagrafiche` e verifica:
- I tre tab sono visibili e cliccabili
- Il tab Clienti/Fornitori/Vettori mostra la tabella esistente
- Il tab Articoli mostra la tabella articoli (vuota o con dati)
- Il tab Magazzini mostra la tabella magazzini

- [ ] **Step 5: Commit finale**

```bash
git add src/app/anagrafiche/page.tsx
git commit -m "feat: aggiungi tabs Articoli e Magazzini ad anagrafiche"
```
