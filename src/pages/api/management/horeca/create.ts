import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementPlaceSchema } from '../../../../server/validation/management-place';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementPlaceSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/horeca?err=validazione', 303);

  const d = parsed.data;
  const tags = d.tags
    ? d.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  try {
    await sql`
      INSERT INTO places (lang, slug, title, kind, address, phone, website, tripadvisor, michelin, tags, body, status)
      VALUES (
        'it', ${d.slug}, ${d.title}, ${d.kind}, ${d.address},
        ${d.phone ?? null}, ${d.website ?? null}, ${d.tripadvisor ?? null},
        ${d.michelin ?? null}, ${JSON.stringify(tags)}, ${d.body ?? null}, ${d.status}
      )
    `;
  } catch (err) {
    console.error('[horeca/create] db error:', err);
    return redirect('/management/horeca?err=db', 303);
  }

  return redirect('/management/horeca?ok=1', 303);
};
