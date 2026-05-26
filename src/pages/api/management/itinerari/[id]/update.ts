import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { managementItinerarySchema } from '../../../../../server/validation/management-itinerary';

export const prerender = false;

export const POST: APIRoute = async ({ request, params, redirect }) => {
  const { id } = params;
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementItinerarySchema.safeParse(raw);
  if (!parsed.success) return redirect(`/management/itinerari/${id}?err=validazione`, 303);

  const d = parsed.data;
  const mode: string[] = [];
  if (d.mode_piedi === 'on') mode.push('piedi');
  if (d.mode_bici  === 'on') mode.push('bici');

  try {
    await sql`
      UPDATE itineraries SET
        slug           = ${d.slug},
        title          = ${d.title},
        category       = ${d.category},
        difficulty     = ${d.difficulty},
        description    = ${d.description ?? null},
        distance_km    = ${d.distance_km ?? null},
        duration_min   = ${d.duration_min ?? null},
        terrain        = ${d.terrain ?? null},
        duration_label = ${d.duration_label ?? null},
        body           = ${d.body ?? null},
        mode           = ${JSON.stringify(mode)},
        coords         = ${d.coords_json ?? '[]'},
        status         = ${d.status}
      WHERE id = ${Number(id)} AND lang = 'it'
    `;
  } catch (err) {
    console.error('[itinerari/update] db error:', err);
    return redirect(`/management/itinerari/${id}?err=db`, 303);
  }

  return redirect('/management/itinerari?ok=1', 303);
};
