-- ── notice_responses ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notice_responses (
  id          SERIAL PRIMARY KEY,
  notice_slug TEXT NOT NULL,
  nome        TEXT NOT NULL,
  cognome     TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table already existed without these columns, add them
ALTER TABLE notice_responses ADD COLUMN IF NOT EXISTS read       BOOLEAN     NOT NULL DEFAULT false;
ALTER TABLE notice_responses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_nr_slug ON notice_responses (notice_slug);
CREATE INDEX IF NOT EXISTS idx_nr_unread ON notice_responses (read) WHERE NOT read;
