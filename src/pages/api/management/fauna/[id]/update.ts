import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { managementSightingSchema } from '../../../../../server/validation/management-sighting';

export const prerender = false;

export const POST: APIRoute = async ({ request, params, redirect }) => {
  const { id } = params;
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementSightingSchema.safeParse(raw);
  if (!parsed.success) return redirect(`/management/fauna/${id}?err=validazione`, 303);

  const d = parsed.data;
  const lat = d.coords_lat ? parseFloat(d.coords_lat) : null;
  const lng = d.coords_lng ? parseFloat(d.coords_lng) : null;
  const coords = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng))
    ? JSON.stringify([lat, lng])
    : null;

  try {
    await sql`
      UPDATE sightings SET
        slug     = ${d.slug},
        title    = ${d.title},
        category = ${d.category},
        date     = ${d.date || null},
        coords   = ${coords},
        notes    = ${d.notes ?? null},
        body     = ${d.body ?? null},
        status   = ${d.status}
      WHERE id = ${Number(id)} AND lang = 'it'
    `;
  } catch (err) {
    console.error('[fauna/update] db error:', err);
    return redirect(`/management/fauna/${id}?err=db`, 303);
  }

  return redirect('/management/fauna?ok=1', 303);
};
