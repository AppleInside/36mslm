import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params }) => {
  const id = Number(params.id);
  if (!id) return redirect('/management/segnalazioni?err=1', 303);

  try {
    const result = await sql`DELETE FROM reports WHERE id = ${id}`;
    if (result.count === 0) {
      console.error('[segnalazioni/delete] no rows deleted for id:', id);
      return redirect('/management/segnalazioni?err=1', 303);
    }
  } catch {
    return redirect('/management/segnalazioni?err=1', 303);
  }

  return redirect('/management/segnalazioni?ok=1', 303);
};
