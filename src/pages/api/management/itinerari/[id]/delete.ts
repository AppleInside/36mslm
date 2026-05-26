import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ params, redirect }) => {
  const { id } = params;
  try {
    await sql`DELETE FROM itineraries WHERE id = ${Number(id)} AND lang = 'it'`;
  } catch (err) {
    console.error('[itinerari/delete] db error:', err);
    return redirect('/management/itinerari?err=db', 303);
  }
  return redirect('/management/itinerari?ok=1', 303);
};
