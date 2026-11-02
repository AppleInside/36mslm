-- Archiviazione avvisi: un avviso archiviato sparisce dal sito pubblico
-- e dalla lista principale del management, ma resta ripristinabile
ALTER TABLE notices ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_notices_archived_at ON notices (archived_at);
