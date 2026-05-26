import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementSightingSchema } from '../../../../server/validation/management-sighting';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementSightingSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/fauna?err=validazione', 303);

  const d = parsed.data;
  const lat = d.coords_lat ? parseFloat(d.coords_lat) : null;
  const lng = d.coords_lng ? parseFloat(d.coords_lng) : null;
  const coords = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng))
    ? JSON.stringify([lat, lng])
    : null;

  try {
    await sql`
      INSERT INTO sightings (lang, slug, title, category, date, coords, notes, body, status)
      VALUES (
        'it', ${d.slug}, ${d.title}, ${d.category},
        ${d.date || null},
        ${coords},
        ${d.notes ?? null}, ${d.body ?? null}, ${d.status}
      )
    `;
  } catch (err) {
    console.error('[fauna/create] db error:', err);
    return redirect('/management/fauna?err=db', 303);
  }

  return redirect('/management/fauna?ok=1', 303);
};
