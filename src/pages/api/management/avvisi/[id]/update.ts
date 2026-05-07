import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { managementNoticeSchema } from '../../../../../server/validation/management-notice';
import { verifySession, COOKIE_NAME } from '../../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies, params }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const id = Number(params.id);
  if (!id) return redirect('/management/avvisi?err=1', 303);

  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementNoticeSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/avvisi?err=validazione', 303);

  const d = parsed.data;
  const tags = d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  await sql`
    UPDATE notices SET
      slug       = ${d.slug},
      title      = ${d.title},
      body       = ${d.body},
      date       = ${d.date},
      priority   = ${d.priority},
      cta        = ${d.cta},
      tags       = ${tags},
      expires_at = ${d.expires_at},
      status     = ${d.status}
    WHERE id = ${id} AND lang = 'it'
  `;

  return redirect('/management/avvisi?ok=1', 303);
};
