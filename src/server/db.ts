import postgres from 'postgres';

const url = import.meta.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

export const sql = postgres(url, {
  max: 4,
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
