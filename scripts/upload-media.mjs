import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// Legge il file .env manualmente
function loadEnv() {
  try {
    const lines = readFileSync('.env', 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      process.env[key] = val;
    }
  } catch {
    console.error('File .env non trovato nella cartella del progetto.');
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET       = process.env.SUPABASE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_KEY || !BUCKET) {
  console.error('Mancano variabili nel .env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET');
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

// Esclude thumbnail WordPress (es. -300x211.jpg)
const WP_THUMB = /-\d+x\d+\.(jpg|jpeg|png)$/i;

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
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
    console.log(`✓  ${storagePath}`);
    return true;
  } else {
    const err = await res.text();
    console.error(`✗  ${storagePath} → ${res.status} ${err}`);
    return false;
  }
}

async function main() {
  const dirs = [
    { localBase: 'public/media/storico', storagePrefix: 'storico' },
    { localBase: 'public/media/legacy',  storagePrefix: 'legacy'  },
  ];

  let total = 0, ok = 0, skipped = 0;

  for (const { localBase, storagePrefix } of dirs) {
    let files;
    try { files = walk(localBase); } catch { continue; }

    for (const full of files) {
      total++;
      const rel = full.replace(/\\/g, '/').replace(localBase, '').replace(/^\//, '');

      if (WP_THUMB.test(rel)) { skipped++; continue; }

      const result = await upload(full, `${storagePrefix}/${rel}`);
      if (result) ok++;
    }
  }

  console.log(`\nDone: ${ok} caricati, ${skipped} thumbnail saltati, ${total - ok - skipped} errori.`);
}

main().catch(console.error);
