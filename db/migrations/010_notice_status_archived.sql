-- L'archiviazione diventa un valore di status ('archived') al posto della colonna archived_at
ALTER TABLE notices DROP CONSTRAINT IF EXISTS notices_status_check;
ALTER TABLE notices ADD CONSTRAINT notices_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

UPDATE notices SET status = 'archived' WHERE archived_at IS NOT NULL;
