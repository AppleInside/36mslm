import type { APIRoute } from 'astro';
import { sql } from '../../server/db';
import { z } from 'zod';

export const prerender = false;

const schema = z.object({
  lang:    z.enum(['it', 'en']).default('it'),
  name:    z.string().min(1).max(120).transform(v => v.trim()),
  email:   z.string().email().max(200).transform(v => v.trim()),
  subject: z.string().min(1).max(200).transform(v => v.trim()),
  body:    z.string().min(5).max(5000).transform(v => v.trim()),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const raw  = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const lang = (raw.lang === 'en') ? 'en' : 'it';
  const back = (typeof raw.back === 'string' && raw.back.startsWith('/') && !raw.back.startsWith('//'))
    ? raw.back
    : `/${lang}/partecipa/segnalazioni`;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return redirect(`${back}?err=1`, 303);

  const source = (typeof raw.source === 'string' && raw.source.length <= 50) ? raw.source : null;

  const d = parsed.data;
  try {
    await sql`
      INSERT INTO reports (lang, name, email, subject, body, source)
      VALUES (${d.lang}, ${d.name}, ${d.email}, ${d.subject}, ${d.body}, ${source})
    `;
  } catch {
    return redirect(`${back}?err=1`, 303);
  }

  return redirect(`${back}?ok=1`, 303);
};
