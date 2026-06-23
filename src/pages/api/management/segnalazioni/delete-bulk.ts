import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const json = (ok: boolean, status = 200) =>
    new Response(JSON.stringify({ ok }), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json() as { items: { id: string; type: string }[] };
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) return json(false, 400);

    const reportIds = items.filter(i => i.type === 'proposta').map(i => i.id);
    const noticeIds = items.filter(i => i.type === 'partecipazione').map(i => i.id);

    if (reportIds.length > 0)
      await sql`DELETE FROM reports WHERE id::text = ANY(${reportIds})`;
    if (noticeIds.length > 0)
      await sql`DELETE FROM notice_responses WHERE id::text = ANY(${noticeIds})`;

    return json(true);
  } catch (e) {
    console.error('[delete-bulk]', e);
    return json(false, 500);
  }
};
