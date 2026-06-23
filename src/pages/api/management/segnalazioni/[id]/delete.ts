import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, params, url }) => {
  const rawId = params.id ?? '';
  const type  = url.searchParams.get('type'); // 'proposta' | 'partecipazione'

  try {
    if (type === 'partecipazione') {
      // notice_responses uses UUID id
      const result = await sql`DELETE FROM notice_responses WHERE id = ${rawId}::uuid`;
      if (result.count === 0) return redirect('/management/segnalazioni?err=1', 303);
    } else {
      // reports uses integer id
      const id = Number(rawId);
      if (!id) return redirect('/management/segnalazioni?err=1', 303);
      const result = await sql`DELETE FROM reports WHERE id = ${id}`;
      if (result.count === 0) return redirect('/management/segnalazioni?err=1', 303);
    }
  } catch (e) {
    console.error('[segnalazioni/delete]', e);
    return redirect('/management/segnalazioni?err=1', 303);
  }

  return redirect('/management/segnalazioni?ok=1', 303);
};
