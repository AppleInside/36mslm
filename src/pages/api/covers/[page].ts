import type { APIRoute } from 'astro';
import { sql } from '../../../server/db';
import { COOKIE_NAME, verifySession } from '../../../lib/auth';

export const prerender = false;

type CoverRow = { cover_url: string; cover_position: string };

export const GET: APIRoute = async ({ params }) => {
  const pageKey = params.page;
  if (!pageKey) return new Response('Bad request', { status: 400 });

  const rows = await sql<CoverRow[]>`
    SELECT cover_url, cover_position FROM page_covers WHERE page_key = ${pageKey} LIMIT 1
  `;

  if (!rows[0]) return new Response(JSON.stringify(null), { status: 200, headers: { 'Content-Type': 'application/json' } });

  return new Response(JSON.stringify(rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function uploadToSupabase(file: File, path: string): Promise<string> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_KEY;
  const bucket = import.meta.env.SUPABASE_BUCKET;
  const bytes = await file.arrayBuffer();
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pageKey = params.page;
  if (!pageKey) return new Response('Bad request', { status: 400 });

  const form = await request.formData();
  const position = String(form.get('position') ?? 'center 50%');

  const file = form.get('cover') as File | null;
  const hasFile = file && file.size > 0;

  if (hasFile) {
    if (!file!.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Formato non valido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (file!.size > 8 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File troppo grande (max 8 MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const ext = file!.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const coverUrl = await uploadToSupabase(file!, `covers/${pageKey}.${ext}`);
    await sql`
      INSERT INTO page_covers (page_key, cover_url, cover_position, updated_at)
      VALUES (${pageKey}, ${coverUrl}, ${position}, NOW())
      ON CONFLICT (page_key) DO UPDATE
        SET cover_url = EXCLUDED.cover_url,
            cover_position = EXCLUDED.cover_position,
            updated_at = NOW()
    `;
    return new Response(JSON.stringify({ ok: true, cover_url: coverUrl, cover_position: position }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Position-only update (no new file): update only cover_position on existing row
  const existing = await sql<{ cover_url: string }[]>`
    SELECT cover_url FROM page_covers WHERE page_key = ${pageKey} LIMIT 1
  `;
  if (!existing[0]) {
    return new Response(JSON.stringify({ error: 'Nessuna copertina salvata' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  await sql`
    UPDATE page_covers SET cover_position = ${position}, updated_at = NOW()
    WHERE page_key = ${pageKey}
  `;
  return new Response(JSON.stringify({ ok: true, cover_url: existing[0].cover_url, cover_position: position }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
