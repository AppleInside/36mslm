import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementNoticeSchema } from '../../../../server/validation/management-notice';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementNoticeSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/avvisi?err=validazione', 303);

  const d = parsed.data;
  const tags = d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  try {
    await sql`
      INSERT INTO notices (lang, slug, title, body, date, priority, cta, tags, expires_at, status, publish_at)
      VALUES ('it', ${d.slug}, ${d.title}, ${d.body}, ${d.date}, ${d.priority},
              ${d.cta}, ${tags}, ${d.expires_at}, ${d.status}, ${d.publish_at ?? null})
    `;
  } catch (err) {
    console.error('[avvisi/create] db error:', err);
    return redirect('/management/avvisi?err=db', 303);
  }

  return redirect('/management/avvisi?ok=1', 303);
};
