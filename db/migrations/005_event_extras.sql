-- Add date_end and cover_type to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS date_end DATE NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_type TEXT NOT NULL DEFAULT 'cover'
  CHECK (cover_type IN ('cover', 'locandina'));
