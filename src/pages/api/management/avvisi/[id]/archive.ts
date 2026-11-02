import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

// archive=1 archivia, archive=0 ripristina
export const POST: APIRoute = async ({ request, redirect, params }) => {
  const id = Number(params.id);
  if (!id) return redirect('/management/avvisi?err=1', 303);

  const form = await request.formData();
  const archive = form.get('archive') !== '0';

  try {
    await sql`
      UPDATE notices
      SET archived_at = ${archive ? new Date() : null}
      WHERE id = ${id} AND lang = 'it'
    `;
  } catch (err) {
    console.error('[avvisi/archive] db error:', err);
    return redirect('/management/avvisi?err=db', 303);
  }

  return redirect(`/management/avvisi?ok=1${archive ? '' : '&vista=archiviati'}`, 303);
};
