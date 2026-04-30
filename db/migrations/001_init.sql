CREATE TABLE IF NOT EXISTS event_signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug    text NOT NULL,
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text,
  party_size    integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  notes         text,
  source_lang   text NOT NULL CHECK (source_lang IN ('it','en')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_signups_event_slug_idx ON event_signups (event_slug);
CREATE INDEX IF NOT EXISTS event_signups_created_at_idx ON event_signups (created_at DESC);
