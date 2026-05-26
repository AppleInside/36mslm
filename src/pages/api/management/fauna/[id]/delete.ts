import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ params, redirect }) => {
  const { id } = params;
  try {
    await sql`DELETE FROM sightings WHERE id = ${Number(id)} AND lang = 'it'`;
  } catch (err) {
    console.error('[fauna/delete] db error:', err);
    return redirect('/management/fauna?err=db', 303);
  }
  return redirect('/management/fauna?ok=1', 303);
};
