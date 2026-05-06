import type { APIRoute } from 'astro';
import { sql } from '../../server/db';
import { z } from 'zod';

export const prerender = false;

const schema = z.object({
  notice_slug: z.string().min(1),
  nome: z.string().min(1),
  cognome: z.string().min(1),
  telefono: z.string().min(6),
});

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, errors: parsed.error.flatten() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { notice_slug, nome, cognome, telefono } = parsed.data;

  await sql`
    INSERT INTO notice_responses (notice_slug, nome, cognome, telefono)
    VALUES (${notice_slug}, ${nome}, ${cognome}, ${telefono})
  `;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
