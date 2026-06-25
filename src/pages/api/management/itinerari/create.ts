import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementItinerarySchema } from '../../../../server/validation/management-itinerary';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementItinerarySchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/itinerari?err=validazione', 303);

  const d = parsed.data;
  const mode: string[] = [];
  if (d.mode_piedi === 'on') mode.push('piedi');
  if (d.mode_bici  === 'on') mode.push('bici');

  let coordsParsed: unknown[];
  try {
    coordsParsed = JSON.parse(d.coords_json ?? '[]');
  } catch {
    coordsParsed = [];
  }

  try {
    await sql`
      INSERT INTO itineraries
        (lang, slug, title, category, difficulty, description, distance_km, duration_min,
         terrain, duration_label, body, mode, coords, status)
      VALUES
        ('it', ${d.slug}, ${d.title}, ${d.category}, ${d.difficulty},
         ${d.description ?? null}, ${d.distance_km ?? null}, ${d.duration_min ?? null},
         ${d.terrain ?? null}, ${d.duration_label ?? null}, ${d.body ?? null},
         ${mode}, ${coordsParsed}, ${d.status})
    `;
  } catch (err) {
    console.error('[itinerari/create] db error:', err);
    return redirect('/management/itinerari?err=db', 303);
  }

  return redirect('/management/itinerari?ok=1', 303);
};
