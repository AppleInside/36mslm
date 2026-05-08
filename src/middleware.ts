import { defineMiddleware } from 'astro:middleware';
import { verifySession, COOKIE_NAME } from './lib/auth';
import { sql } from './server/db';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  const isApiRoute = pathname.startsWith('/api/management/') &&
    !pathname.startsWith('/api/management/login') &&
    !pathname.startsWith('/api/management/logout');

  const isPageRoute = pathname.startsWith('/management/');

  if (!isApiRoute && !isPageRoute) return next();

  const token = ctx.cookies.get(COOKIE_NAME)?.value;
  const userId = token ? verifySession(token) : null;

  if (!userId) return ctx.redirect('/management', 302);

  // API routes only need auth — no DB query needed (handlers are self-contained)
  if (isApiRoute) {
    ctx.locals.userId = userId;
    return next();
  }

  // Pages need the display name for the navbar
  // On DB error, fall back to a default name rather than redirecting away
  ctx.locals.userId = userId;
  ctx.locals.userDisplayName = '';
  try {
    const rows = await sql<{ display_name: string }[]>`
      SELECT display_name FROM users WHERE id = ${userId} LIMIT 1
    `;
    if (!rows.length) return ctx.redirect('/management', 302);
    ctx.locals.userDisplayName = rows[0].display_name;
  } catch (err) {
    console.error('[middleware] db error (non-fatal):', err);
    // Continue anyway — the page will load with an empty display name
    // rather than failing and redirecting the user away
  }

  return next();
});
