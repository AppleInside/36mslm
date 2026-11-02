import postgres from 'postgres';

const url = import.meta.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

export function toProxyUrl(coverUrl: string | null): string | null {
  if (!coverUrl) return null;
  // Extract the path after /storage/v1/object/[public/]<bucket>/
  const m = coverUrl.match(/\/storage\/v1\/object\/(?:public\/)?[^/]+\/(.+)$/);
  if (!m) return coverUrl;
  return `/api/media/${m[1]}`;
}

export const sql = postgres(url, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
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
  date_end: Date | null;
  time_start: string | null;
  location: string | null;
  description: string | null;
  signup_required: boolean;
  cover_url: string | null;
  cover_type: 'cover' | 'locandina';
};

export async function getEvents(lang: string): Promise<DbEvent[]> {
  const rows = await sql<DbEvent[]>`
    SELECT id, lang, slug, title, date, date_end, time_start, location, description, signup_required, cover_url, cover_type
    FROM events
    WHERE lang = ${lang} AND status = 'published'
      AND (publish_at IS NULL OR publish_at <= NOW())
    ORDER BY date ASC
  `;
  return rows.map(r => ({ ...r, cover_url: toProxyUrl(r.cover_url) }));
}

export async function getEvent(lang: string, slug: string): Promise<DbEvent | null> {
  const rows = await sql<DbEvent[]>`
    SELECT id, lang, slug, title, date, date_end, time_start, location, description, signup_required, cover_url, cover_type
    FROM events
    WHERE lang = ${lang} AND slug = ${slug} AND status = 'published'
      AND (publish_at IS NULL OR publish_at <= NOW())
    LIMIT 1
  `;
  const row = rows[0];
  return row ? { ...row, cover_url: toProxyUrl(row.cover_url) } : null;
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
  mode: ('piedi' | 'bici')[];
};

export async function getItineraries(lang: string): Promise<DbItinerary[]> {
  return sql<DbItinerary[]>`
    SELECT id, lang, slug, title, description, distance_km, duration_min, body,
           category, difficulty, terrain, duration_label, coords, bbox, mode
    FROM itineraries
    WHERE lang = ${lang} AND status = 'published'
    ORDER BY id ASC
  `;
}

export type DbNotice = {
  id: number;
  slug: string;
  lang: string;
  title: string;
  body: string;
  date: Date | null;
  priority: boolean;
  cta: string | null;
  tags: string[];
  attachments: { label: string; url: string }[];
  expires_at: Date | null;
  created_at: Date;
};

export async function getNotices(lang: string): Promise<DbNotice[]> {
  return sql<DbNotice[]>`
    SELECT id, slug, lang, title, body, date, priority, cta, tags, attachments, expires_at, created_at
    FROM notices
    WHERE lang = ${lang}
      AND status = 'published'
      AND slug IS NOT NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (publish_at IS NULL OR publish_at <= NOW())
    ORDER BY priority DESC, date DESC NULLS LAST, created_at DESC
  `;
}
