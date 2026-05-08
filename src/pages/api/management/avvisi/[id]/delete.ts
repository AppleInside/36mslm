import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params }) => {
  const id = Number(params.id);
  if (!id) return redirect('/management/avvisi?err=1', 303);

  try {
    await sql`DELETE FROM notices WHERE id = ${id} AND lang = 'it'`;
  } catch (err) {
    console.error('[avvisi/delete] db error:', err);
    return redirect('/management/avvisi?err=db', 303);
  }

  return redirect('/management/avvisi?ok=1', 303);
};
