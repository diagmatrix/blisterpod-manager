-- Small, hand-checked collection used by the DB integration smoke tests.
--
-- Structured Scryfall fields are stored as JSON text (color_identity, prices,
-- image_uris) exactly as the ingest path in src/main/scryfallRefresh.ts writes
-- them -- the views depend on that with `->>` and json_array_length().

INSERT INTO scryfall_sets (
    object, id, code, name, set_type, released_at, card_count,
    digital, foil_only, nonfoil_only, scryfall_uri, uri, icon_svg_uri, search_uri
) VALUES
    ('set', '11111111-1111-1111-1111-111111111111', 'gtc', 'Gatecrash', 'expansion', '2013-02-01', 249,
     0, 0, 0, 'https://scryfall.com/sets/gtc', 'https://api.scryfall.com/sets/gtc',
     'https://svgs.scryfall.io/sets/gtc.svg', 'https://api.scryfall.com/cards/search?q=set:gtc'),
    ('set', '22222222-2222-2222-2222-222222222222', 'bfz', 'Battle for Zendikar', 'expansion', '2015-10-02', 274,
     0, 0, 0, 'https://scryfall.com/sets/bfz', 'https://api.scryfall.com/sets/bfz',
     'https://svgs.scryfall.io/sets/bfz.svg', 'https://api.scryfall.com/cards/search?q=set:bfz');

INSERT INTO scryfall_cards (
    id, oracle_id, name, set_name, set_code, set_type, collector_number,
    rarity, color_identity, cmc, released_at, prices, image_uris, digital, lang
) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'oracle-boros-reckoner', 'Boros Reckoner',
     'Gatecrash', 'GTC', 'expansion', '54', 'rare', '["R","W"]', 3, '2013-02-01',
     '{"eur":"4.50","eur_foil":"12.00"}', '{"normal":"https://example.invalid/reckoner.jpg"}', 0, 'en'),
    ('aaaaaaaa-0000-0000-0000-000000000002', 'oracle-gideon', 'Gideon, Ally of Zendikar',
     'Battle for Zendikar', 'BFZ', 'expansion', '163', 'mythic', '["W"]', 4, '2015-10-02',
     '{"eur":"9.00","eur_foil":"20.00"}', '{"normal":"https://example.invalid/gideon.jpg"}', 0, 'en'),
    ('aaaaaaaa-0000-0000-0000-000000000003', 'oracle-wastes', 'Wastes',
     'Battle for Zendikar', 'BFZ', 'expansion', '184', 'common', '[]', 0, '2015-10-02',
     '{"eur":"0.30","eur_foil":"1.10"}', '{"normal":"https://example.invalid/wastes.jpg"}', 0, 'en');

INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES
    ('GTC', '54', 2, 1),
    ('BFZ', '163', 1, 0),
    ('BFZ', '184', 4, 0);
