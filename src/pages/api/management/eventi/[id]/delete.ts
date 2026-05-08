import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params }) => {
  const eventId = Number(params.id);
  if (isNaN(eventId)) return redirect('/management/eventi?err=1', 303);

  try {
    await sql`DELETE FROM events WHERE id = ${eventId} AND lang = 'it'`;
  } catch (err) {
    console.error('[eventi/delete] db error:', err);
    return redirect('/management/eventi?err=db', 303);
  }

  return redirect('/management/eventi?ok=1', 303);
};
