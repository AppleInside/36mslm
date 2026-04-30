import type { APIRoute } from 'astro';
import { eventSignupSchema } from '../../server/validation/event-signup';
import { sql } from '../../server/db';
import { sendAdminNotification } from '../../server/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const contentType = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = Object.fromEntries(form.entries());
  }

  const parsed = eventSignupSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, errors: parsed.error.flatten() }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const data = parsed.data;

  await sql`
    INSERT INTO event_signups (event_slug, name, email, phone, party_size, notes, source_lang)
    VALUES (${data.eventSlug}, ${data.name}, ${data.email}, ${data.phone ?? null}, ${data.partySize}, ${data.notes ?? null}, ${data.sourceLang})
  `;

  await sendAdminNotification(
    `[Polesine36] Nuova iscrizione: ${data.eventSlug}`,
    [
      `Evento: ${data.eventSlug}`,
      `Nome: ${data.name}`,
      `Email: ${data.email}`,
      `Telefono: ${data.phone ?? '—'}`,
      `Persone: ${data.partySize}`,
      `Note: ${data.notes ?? '—'}`,
      `Lingua: ${data.sourceLang}`,
    ].join('\n'),
  );

  const back = `/${data.sourceLang}/eventi/${data.eventSlug}/?signup=ok#iscrivimi`;

  if (contentType.includes('application/json')) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return redirect(back, 303);
};
