import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params }) => {
  const id = Number(params.id);
  if (!id) return redirect('/management/segnalazioni?err=1', 303);

  try {
    const result = await sql`UPDATE reports SET read = true WHERE id = ${id}`;
    if (result.count === 0) {
      console.error('[segnalazioni/mark-read] no rows updated for id:', id);
      return redirect('/management/segnalazioni?err=1', 303);
    }
  } catch {
    return redirect('/management/segnalazioni?err=1', 303);
  }

  return redirect('/management/segnalazioni?ok=read', 303);
};
