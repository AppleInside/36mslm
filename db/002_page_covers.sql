-- ── page_covers ──────────────────────────────────────────────
-- Stores custom cover images for static pages (PageHeader).
-- page_key is a short identifier per page, e.g. 'eventi', 'chi-siamo'.

CREATE TABLE IF NOT EXISTS page_covers (
  page_key         TEXT        PRIMARY KEY,
  cover_url        TEXT        NOT NULL,
  cover_position   TEXT        NOT NULL DEFAULT 'center 30%',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
