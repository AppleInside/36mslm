export const prerender = false;
import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { getCollection } from 'astro:content';

export const POST: APIRoute = async ({ redirect }) => {
  try {
    const entries = await getCollection('sightings');
    const itEntries = entries.filter(e => e.slug.startsWith('it/'));

    for (const entry of itEntries) {
      const slug      = entry.slug.replace('it/', '');
      const { title, date, category, coords, notes, draft } = entry.data;
      const body      = entry.body ?? null;
      const status    = draft ? 'draft' : 'published';
      const coordsJson = JSON.stringify(coords);
      const dateStr   = date.toISOString().slice(0, 10);

      await sql`
        INSERT INTO sightings (lang, slug, title, category, date, coords, notes, body, status)
        SELECT 'it', ${slug}, ${title}, ${category}, ${dateStr}::date, ${coordsJson}, ${notes ?? null}, ${body}, ${status}
        WHERE NOT EXISTS (
          SELECT 1 FROM sightings WHERE slug = ${slug} AND lang = 'it'
        )
      `;
    }

    return redirect('/management/fauna?ok=1', 303);
  } catch (err) {
    console.error('[fauna/importa] error:', err);
    return redirect('/management/fauna?err=import', 303);
  }
};
