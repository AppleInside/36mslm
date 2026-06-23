-- ── Michelin column ───────────────────────────────────────────────────────────
-- Values: NULL = not in guide, 'listed' = in guide (no star), '1'/'2'/'3' = stars
ALTER TABLE places ADD COLUMN IF NOT EXISTS michelin TEXT;

UPDATE places SET michelin = '1'      WHERE lang = 'it' AND slug = 'antica-corte-pallavicina';
UPDATE places SET michelin = 'listed' WHERE lang = 'it' AND slug = 'al-cavallino-bianco';
UPDATE places SET michelin = 'listed' WHERE lang = 'it' AND slug = 'ristorante-colombo';
