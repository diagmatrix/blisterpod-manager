DROP VIEW IF EXISTS scryfall_cards_formatted;
CREATE VIEW scryfall_cards_formatted AS
SELECT
    sc.id                                    AS scryfall_id,
    sc.oracle_id,
    sc.name,
    sc.set_name,
    sc.set_code,
    coalesce(ssf.base_set_code, sc.set_code) AS base_set_code,
    sc.collector_number,
    CASE
        WHEN sc.image_uris IS NULL AND instr(coalesce(sc.name, 'Not found'), '//') > 0
            THEN sc.card_faces -> 0 ->> 'image_uris' ->> 'normal'
        ELSE sc.image_uris ->> 'normal'
    END                                      AS image_url,
    sc.rarity,
    sc.color_identity,
    coalesce(sc.prices ->> 'eur', 0)         AS value_nonfoil,
    coalesce(sc.prices ->> 'eur_foil', 0)    AS value_foil,
    CASE
        WHEN instr(sc.collector_number, '-') > 0
            THEN cast(substr(sc.collector_number, instr(sc.collector_number, '-') + 1) AS integer)
        ELSE
            cast(sc.collector_number AS integer)
    END AS collector_number_normalised,
    sc.released_at,
    CASE
        WHEN sc.set_type = 'token'
            THEN true
        ELSE false
    END                                      AS is_token
FROM scryfall_cards sc
LEFT JOIN scryfall_sets_formatted ssf
    ON sc.set_code = ssf.code
