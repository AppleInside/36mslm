-- Pubblicazione programmata per eventi e avvisi
ALTER TABLE events  ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ NULL;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ NULL;
