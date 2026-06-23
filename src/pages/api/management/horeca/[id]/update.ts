import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { managementPlaceSchema } from '../../../../../server/validation/management-place';

export const prerender = false;

export const POST: APIRoute = async ({ request, params, redirect }) => {
  const { id } = params;
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementPlaceSchema.safeParse(raw);
  if (!parsed.success) return redirect(`/management/horeca/${id}?err=validazione`, 303);

  const d = parsed.data;
  const tags = d.tags
    ? d.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  try {
    await sql`
      UPDATE places SET
        slug    = ${d.slug},
        title   = ${d.title},
        kind    = ${d.kind},
        address = ${d.address},
        phone       = ${d.phone ?? null},
        website     = ${d.website ?? null},
        tripadvisor = ${d.tripadvisor ?? null},
        michelin    = ${d.michelin ?? null},
        tags        = ${JSON.stringify(tags)},
        body    = ${d.body ?? null},
        status  = ${d.status}
      WHERE id = ${Number(id)} AND lang = 'it'
    `;
  } catch (err) {
    console.error('[horeca/update] db error:', err);
    return redirect(`/management/horeca/${id}?err=db`, 303);
  }

  return redirect('/management/horeca?ok=1', 303);
};
