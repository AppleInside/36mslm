-- ── Add mode + cover_url to itineraries ──────────────────────────────────────
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS mode      JSONB NOT NULL DEFAULT '[]';
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- ── sightings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sightings (
  id         SERIAL PRIMARY KEY,
  lang       TEXT NOT NULL DEFAULT 'it',
  slug       TEXT NOT NULL,
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'altro'
             CHECK (category IN ('uccello','mammifero','pesce','rettile','anfibio','pianta','altro')),
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  coords     JSONB,
  notes      TEXT,
  body       TEXT,
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lang, slug)
);

CREATE INDEX IF NOT EXISTS idx_sightings_lang_status ON sightings (lang, status);
CREATE INDEX IF NOT EXISTS idx_sightings_category    ON sightings (category);

-- ── places ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id         SERIAL PRIMARY KEY,
  lang       TEXT NOT NULL DEFAULT 'it',
  slug       TEXT NOT NULL,
  title      TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'altro'
             CHECK (kind IN ('ristorante','agriturismo','b&b','azienda','altro')),
  address    TEXT NOT NULL DEFAULT '',
  coords     JSONB,
  phone      TEXT,
  website    TEXT,
  body       TEXT,
  tags       JSONB NOT NULL DEFAULT '[]',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lang, slug)
);

CREATE INDEX IF NOT EXISTS idx_places_lang_status ON places (lang, status);
CREATE INDEX IF NOT EXISTS idx_places_kind        ON places (kind);
