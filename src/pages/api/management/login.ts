import type { APIRoute } from 'astro';
import { sql } from '../../../server/db';
import { createSession, verifyPassword, COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');

  if (!email || !password) return redirect('/management?err=credenziali', 303);

  const rows = await sql<{ id: number; password_hash: string }[]>`
    SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1
  `;

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return redirect('/management?err=credenziali', 303);
  }

  await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

  cookies.set(COOKIE_NAME, createSession(user.id), {
    httpOnly: true,
    sameSite: 'strict',
    secure: import.meta.env.PROD,
    path: '/management',
    maxAge: 24 * 60 * 60,
  });

  return redirect('/management/eventi', 303);
};
