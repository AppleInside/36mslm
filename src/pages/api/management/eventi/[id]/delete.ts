import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { verifySession, COOKIE_NAME } from '../../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, cookies, params }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const eventId = Number(params.id);
  if (isNaN(eventId)) return redirect('/management/eventi?err=1', 303);

  await sql`DELETE FROM events WHERE id = ${eventId} AND lang = 'it'`;

  return redirect('/management/eventi?ok=1', 303);
};
