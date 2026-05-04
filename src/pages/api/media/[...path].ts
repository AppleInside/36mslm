export const prerender = false;

import type { APIRoute } from 'astro';

const SUPABASE_URL = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
const BUCKET      = import.meta.env.SUPABASE_BUCKET ?? process.env.SUPABASE_BUCKET;

export const GET: APIRoute = async ({ params }) => {
  const path = params.path;
  if (!path) return new Response('Not found', { status: 404 });

  if (!SUPABASE_URL || !SUPABASE_KEY || !BUCKET) {
    return new Response('Storage not configured', { status: 500 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
    }
  );

  if (!res.ok) return new Response('Not found', { status: 404 });

  const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  return new Response(res.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
