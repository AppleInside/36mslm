import type { APIRoute } from 'astro';
import { sql } from '../../../../server/db';
import { managementEventSchema } from '../../../../server/validation/management-event';
import { verifySession, COOKIE_NAME } from '../../../../lib/auth';

export const prerender = false;

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

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  // Double-check auth
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifySession(token)) return redirect('/management', 302);

  const form = await request.formData();
  const raw = Object.fromEntries(
    [...form.entries()].filter(([, v]) => typeof v === 'string')
  );

  const parsed = managementEventSchema.safeParse(raw);
  if (!parsed.success) return redirect('/management/eventi?err=validazione', 303);

  const d = parsed.data;
  let cover_url: string | null = null;

  const coverFile = form.get('cover') as File | null;
  if (coverFile && coverFile.size > 0) {
    if (!coverFile.type.startsWith('image/')) return redirect('/management/eventi?err=immagine', 303);
    if (coverFile.size > 5 * 1024 * 1024) return redirect('/management/eventi?err=immagine', 303);
    const ext = coverFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    cover_url = await uploadToSupabase(coverFile, `eventi/${d.slug}.${ext}`);
  }

  await sql`
    INSERT INTO events (lang, slug, title, date, time_start, time_end, location, description, cover_url, signup_required, status)
    VALUES ('it', ${d.slug}, ${d.title}, ${d.date}, ${d.time_start}, ${d.time_end}, ${d.location}, ${d.description}, ${cover_url}, ${d.signup_required}, ${d.status})
  `;

  return redirect('/management/eventi?ok=1', 303);
};
