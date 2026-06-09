import type { APIRoute } from 'astro';
import { COOKIE_NAME, verifySession } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
