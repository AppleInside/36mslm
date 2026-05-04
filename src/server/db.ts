import postgres from 'postgres';

const url = import.meta.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

export const sql = postgres(url, {
  max: 1,
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

export type DbEvent = {
  id: number;
  lang: string;
  slug: string;
  title: string;
  date: Date;
  time_start: string | null;
  location: string | null;
  description: string | null;
  signup_required: boolean;
};

export async function getEvents(lang: string): Promise<DbEvent[]> {
  return sql<DbEvent[]>`
    SELECT id, lang, slug, title, date, time_start, location, description, signup_required
    FROM events
    WHERE lang = ${lang} AND status = 'published'
    ORDER BY date ASC
  `;
}

export async function getEvent(lang: string, slug: string): Promise<DbEvent | null> {
  const rows = await sql<DbEvent[]>`
    SELECT id, lang, slug, title, date, time_start, location, description, signup_required
    FROM events
    WHERE lang = ${lang} AND slug = ${slug} AND status = 'published'
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export type DbItinerary = {
  id: number;
  lang: string;
  slug: string;
  title: string;
  description: string | null;
  distance_km: number | null;
  duration_min: number | null;
  body: string | null;
  category: 'naturalistico' | 'storico' | 'sportivo';
  difficulty: 'facile' | 'medio' | 'impegnativo';
  terrain: string | null;
  duration_label: string | null;
  coords: [number, number][];
  bbox: [number, number, number, number] | null;
};

export async function getItineraries(lang: string): Promise<DbItinerary[]> {
  return sql<DbItinerary[]>`
    SELECT id, lang, slug, title, description, distance_km, duration_min, body,
           category, difficulty, terrain, duration_label, coords, bbox
    FROM itineraries
    WHERE lang = ${lang} AND status = 'published'
    ORDER BY id ASC
  `;
}
