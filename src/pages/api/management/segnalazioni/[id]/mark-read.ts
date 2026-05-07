import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params }) => {
  const id = Number(params.id);
  if (!id) return redirect('/management/segnalazioni?err=1', 303);

  try {
    await sql`UPDATE reports SET read = true WHERE id = ${id}`;
  } catch {
    return redirect('/management/segnalazioni?err=1', 303);
  }

  return redirect('/management/segnalazioni', 303);
};
