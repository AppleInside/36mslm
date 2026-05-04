-- ============================================================
-- 36 m s.l.m. — schema
-- DB: Supabase (Postgres 15+)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ── users ────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);


-- ── images (file su Supabase Storage) ────────────────────────
CREATE TABLE images (
  id           SERIAL PRIMARY KEY,
  filename     TEXT NOT NULL,
  mimetype     TEXT NOT NULL,
  size_bytes   INT  NOT NULL,
  storage_path TEXT NOT NULL,
  alt_text     TEXT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by  INT REFERENCES users(id) ON DELETE SET NULL
);


-- ── events ───────────────────────────────────────────────────
CREATE TABLE events (
  id              SERIAL PRIMARY KEY,
  lang            TEXT NOT NULL CHECK (lang IN ('it','en')),
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  date            DATE NOT NULL,
  time_start      TIME,
  time_end        TIME,
  location        TEXT,
  description     TEXT,
  cover_image_id  INT REFERENCES images(id) ON DELETE SET NULL,
  signup_required BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lang, slug)
);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_events_lang_status ON events (lang, status);
CREATE INDEX idx_events_date        ON events (date);


-- ── recipes ──────────────────────────────────────────────────
CREATE TABLE recipes (
  id          SERIAL PRIMARY KEY,
  lang        TEXT NOT NULL CHECK (lang IN ('it','en')),
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('dolci','liquori','conserve')),
  author      TEXT,
  photo_id    INT REFERENCES images(id) ON DELETE SET NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps       JSONB NOT NULL DEFAULT '[]',
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lang, slug)
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_recipes_lang_status ON recipes (lang, status);
CREATE INDEX idx_recipes_category    ON recipes (category);


-- ── itineraries ──────────────────────────────────────────────
CREATE TABLE itineraries (
  id             SERIAL PRIMARY KEY,
  lang           TEXT NOT NULL CHECK (lang IN ('it','en')),
  slug           TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  cover_image_id INT REFERENCES images(id) ON DELETE SET NULL,
  distance_km    NUMERIC(5,1),
  duration_min   INT,
  body           TEXT,
  category       TEXT NOT NULL DEFAULT 'naturalistico' CHECK (category IN ('naturalistico','storico','sportivo')),
  difficulty     TEXT NOT NULL DEFAULT 'facile' CHECK (difficulty IN ('facile','medio','impegnativo')),
  terrain        TEXT,
  duration_label TEXT,
  coords         JSONB NOT NULL DEFAULT '[]',
  bbox           JSONB,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lang, slug)
);

CREATE TRIGGER itineraries_updated_at
  BEFORE UPDATE ON itineraries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_itineraries_lang_status ON itineraries (lang, status);


-- ── notices ───────────────────────────────────────────────────
CREATE TABLE notices (
  id         SERIAL PRIMARY KEY,
  lang       TEXT NOT NULL CHECK (lang IN ('it','en')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_notices_lang_status ON notices (lang, status);
CREATE INDEX idx_notices_expires_at  ON notices (expires_at);


-- ── contacts ─────────────────────────────────────────────────
CREATE TABLE contacts (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('contatto','segnalazione','evento')),
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ,
  notes       TEXT
);

CREATE INDEX idx_contacts_received_at ON contacts (received_at DESC);
CREATE INDEX idx_contacts_read_at     ON contacts (read_at);


-- ── members ──────────────────────────────────────────────────
CREATE TABLE members (
  id             SERIAL PRIMARY KEY,
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT UNIQUE,
  phone          TEXT,
  tessera_number TEXT UNIQUE,
  joined_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at     DATE,
  status         TEXT NOT NULL DEFAULT 'attivo' CHECK (status IN ('attivo','scaduto','sospeso')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_members_status     ON members (status);
CREATE INDEX idx_members_expires_at ON members (expires_at);


-- ── event_signups ─────────────────────────────────────────────
CREATE TABLE event_signups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug  text NOT NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  party_size  integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  notes       text,
  source_lang text NOT NULL CHECK (source_lang IN ('it','en')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_signups_event_slug_idx ON event_signups (event_slug);
CREATE INDEX event_signups_created_at_idx ON event_signups (created_at DESC);
