import type { APIRoute } from 'astro';
import { sql } from '../../../../../server/db';
import { verifySession, COOKIE_NAME } from '../../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, cookies, params }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const id = Number(params.id);
  if (!id) return redirect('/management/avvisi?err=1', 303);

  await sql`DELETE FROM notices WHERE id = ${id} AND lang = 'it'`;

  return redirect('/management/avvisi?ok=1', 303);
};
