/**
 * Carica tutti i file media su Supabase Storage.
 * Uso: node scripts/upload-media.mjs
 *
 * Variabili d'ambiente richieste (nel file .env):
 *   SUPABASE_URL          es. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role key (Project Settings → API)
 *   SUPABASE_BUCKET       nome del bucket (es. media)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), '');

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_KEY;
const BUCKET       = env.SUPABASE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_KEY || !BUCKET) {
  console.error('Mancano variabili d\'ambiente: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET');
  process.exit(1);
}

const MIME = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.mp3':  'audio/mpeg',
};

// Esclude i thumbnail WordPress (es. -300x211.jpg, -768x432.jpg)
const WP_THUMB = /-\d+x\d+\.(jpg|jpeg|png)$/i;

function walk(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full, base));
    } else {
      results.push({ full, rel: full.replace(base, '').replace(/\\/g, '/').replace(/^\//, '') });
    }
  }
  return results;
}

async function upload(localPath, storagePath) {
  const ext  = extname(localPath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;

  const data = readFileSync(localPath);

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  mime,
        'x-upsert':      'true',
      },
      body: data,
    }
  );

  if (res.ok) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    console.log(`✓  ${storagePath}`);
    return publicUrl;
  } else {
    const err = await res.text();
    console.error(`✗  ${storagePath} → ${res.status} ${err}`);
    return null;
  }
}

async function main() {
  const dirs = [
    { localBase: 'public/media/storico', storagePrefix: 'storico' },
    { localBase: 'public/media/legacy',  storagePrefix: 'legacy'  },
  ];

  let total = 0, ok = 0, skip = 0;

  for (const { localBase, storagePrefix } of dirs) {
    let files;
    try { files = walk(localBase); } catch { continue; }

    for (const { full, rel } of files) {
      total++;

      // Salta thumbnail WordPress
      if (WP_THUMB.test(rel)) { skip++; continue; }

      const storagePath = `${storagePrefix}/${rel}`;
      const result = await upload(full, storagePath);
      if (result) ok++;
    }
  }

  console.log(`\nCompletato: ${ok} caricati, ${skip} thumbnail saltati, ${total - ok - skip} errori su ${total} file totali.`);
}

main().catch(console.error);
