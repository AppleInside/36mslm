import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ params, redirect }) => {
  const { id } = params;
  try {
    await sql`DELETE FROM places WHERE id = ${Number(id)} AND lang = 'it'`;
  } catch (err) {
    console.error('[horeca/delete] db error:', err);
    return redirect('/management/horeca?err=db', 303);
  }
  return redirect('/management/horeca?ok=1', 303);
};
