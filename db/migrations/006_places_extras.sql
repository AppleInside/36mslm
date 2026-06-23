-- ── Add cover_url and tripadvisor to places ─────────────────────────────────
ALTER TABLE places ADD COLUMN IF NOT EXISTS cover_url   TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS tripadvisor TEXT;

-- ── Seed: import from MDX content collection ──────────────────────────────────
INSERT INTO places (lang, slug, title, kind, address, coords, phone, website, body, tags, cover_url, status) VALUES

('it', 'al-cavallino-bianco', 'Al Cavallino Bianco', 'ristorante',
 'Via Sbrisi 3, Polesine Zibello (PR)', '[44.9352, 10.1108]',
 '0524 96136', 'https://www.ristorantealcavallinobianco.it',
 'Locale della famiglia Spigaroli, segnalato dalla Guida Michelin. Cucina del territorio attorno al culatello di Zibello DOP, con salumi stagionati nelle cantine storiche dell''Antica Corte Pallavicina.',
 '["culatello","michelin","spigaroli"]', NULL, 'published'),

('it', 'antica-corte-pallavicina', 'Antica Corte Pallavicina', 'agriturismo',
 'Strada Palazzo Due Torri 3, Polesine Zibello (PR)', '[44.9425, 10.0978]',
 '0524 936539', 'https://www.anticacortepallavicinarelais.it',
 'Relais e ristorante stellato Michelin di Massimo Spigaroli, ospitato in una corte cinquecentesca sul Po. Nelle cantine medievali stagionano i culatelli di Zibello DOP tra le brume del fiume; la cucina trasforma quei sapori in una delle tavole più celebrate d''Italia.',
 '["culatello","relais","spigaroli","michelin"]', NULL, 'published'),

('it', 'bb-la-zampa', 'B&B La Zampa', 'b&b',
 'Via Signora 9, Pieveottoville, Polesine Zibello (PR)', '[44.9481, 10.0985]',
 '0521 870335', NULL,
 'Bed & breakfast in una cascina di campagna nella frazione di Pieveottoville, a pochi minuti dall''argine del Po. Camere curate, prima colazione artigianale, ambiente familiare.',
 '["b&b","pieveottoville","campagna"]', NULL, 'published'),

('it', 'cascina-bodriazzo', 'Agriturismo Cascina Bodriazzo', 'agriturismo',
 'Località Bodriazzo 3, Polesine Zibello (PR)', '[44.9278, 10.1348]',
 '349 6677217', 'https://www.cascinabodriazzo.it',
 'Azienda agricola didattica e agriturismo immerso nella campagna parmense. Ristoro con prodotti dell''azienda, attività per famiglie, spazio eventi e ospitalità rurale autentica.',
 '["agriturismo","fattoria","eventi"]', NULL, 'published'),

('it', 'casolare-fratina', 'Casolare Fratina', 'b&b',
 'Vicolo Fratina 3, Polesine Zibello (PR)', '[44.9362, 10.1238]',
 '351 3022459', 'https://www.casolare-fratina.it',
 'Casolare rurale ristrutturato con camere accoglienti, giardino e piscina stagionale. Colazione con prodotti locali, atmosfera tranquilla e buona base per esplorare la bassa parmense e le rive del Po.',
 '["b&b","campagna","piscina"]', NULL, 'published'),

('it', 'fratelli-spigaroli', 'Fratelli Spigaroli', 'azienda',
 'Via Sbrisi 2, Polesine Zibello (PR)', '[44.9349, 10.1105]',
 '0524 936555', 'https://www.fratellispigaroli.it',
 'Produzione artigianale del Culatello di Zibello DOP secondo la tradizione di famiglia. Vendita diretta di salumi stagionati, spalla cruda, strolghino e altri insaccati tipici della bassa parmense.',
 '["culatello","salumeria","artigianale"]', NULL, 'published'),

('it', 'locanda-leon-doro', 'Locanda Leon d''Oro', 'ristorante',
 'Piazza Garibaldi 43, Zibello (PR)', '[44.9298, 10.1435]',
 '0524 99140', NULL,
 'Trattoria storica sul cuore di Zibello, affacciata sulla piazza del paese. Propone i classici della cucina contadina della bassa parmense: tortelli di erbette, culatello, brasati al Fortana.',
 '["trattoria","zibello","tradizione"]', NULL, 'published'),

('it', 'ristorante-colombo', 'Ristorante Colombo', 'ristorante',
 'Via Mogadiscio 103, Polesine Zibello (PR)', '[44.9381, 10.1082]',
 '0524 98114', 'https://www.ristorantecolombopolesineparmense.com',
 'Segnalato dalla Guida Michelin e dal Gambero Rosso, il Colombo è un punto di riferimento per la cucina tradizionale parmense: culatello di Zibello DOP, spalla cotta di San Secondo, anolini in brodo.',
 '["culatello","michelin","tradizione"]', NULL, 'published'),

('it', 'trattoria-al-cavallino', 'Trattoria Al Cavallino', 'ristorante',
 'Via Roma 12, Polesine Parmense', '[44.9351, 10.1245]',
 '+39 0524 000000', NULL,
 'Cucina tradizionale del Po: culatello, anolini in brodo, spalla cotta.',
 '["culatello","tradizione"]',
 '/media/legacy/wp-content_uploads_2021_09_Tortelli-1959-.jpg', 'published'),

('it', 'trattoria-la-buca', 'Trattoria La Buca', 'ristorante',
 'Via Ghizzi 6, Zibello (PR)', '[44.9291, 10.1421]',
 '0524 99214', NULL,
 'Cucina casalinga senza fronzoli, fedele alla tradizione della bassa. Pasta tirata a mano, salumi locali e piatti stagionali. Ambiente familiare, frequentata da chi abita il territorio.',
 '["trattoria","casalinga","zibello"]', NULL, 'published')

ON CONFLICT (lang, slug) DO NOTHING;
