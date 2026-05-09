DROP VIEW IF EXISTS scryfall_cards_formatted;
CREATE VIEW scryfall_cards_formatted AS
SELECT
    id AS scryfall_id,
    oracle_id,
    name,
    set_name,
    set_code,
    collector_number,
    CASE
        WHEN image_uris IS NULL AND instr(coalesce(name, 'Not found'), '//') > 0
            THEN card_faces -> 0 ->> 'image_uris' ->> 'normal'
        ELSE image_uris ->> 'normal'
    END                                AS image_url,
    rarity,
    color_identity,
    coalesce(prices ->> 'eur', 0)      AS value_nonfoil,
    coalesce(prices ->> 'eur_foil', 0) AS value_foil,
    CASE
        WHEN instr(collector_number, '-') > 0
            THEN cast(substr(collector_number, instr(collector_number, '-') + 1) AS integer)
        ELSE
            cast(collector_number AS integer)
    END AS collector_number_normalised,
    released_at
FROM scryfall_cards
