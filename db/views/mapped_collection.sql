DROP VIEW IF EXISTS mapped_collection;
CREATE VIEW mapped_collection AS
SELECT
    sc.id                                AS scryfall_id,
    coalesce(sc.name, 'Not found')       AS card_name,
    c.set_code,
    c.collector_number,
    c.quantity_nonfoil,
    c.quantity_foil,
    c.quantity_nonfoil + c.quantity_foil AS total,
    sc.color_identity,
    sc.rarity,
    CASE
        WHEN sc.set_type = 'token'
            THEN true
        ELSE false
    END                                  AS is_token,
    CASE
        WHEN instr(coalesce(sc.name, 'Not found'), '//') > 0
            THEN sc.card_faces -> 0 ->> 'image_uris' ->> 'normal'
        ELSE sc.image_uris ->> 'normal'
    END                                  AS image_url,
    round(
        coalesce(sc.prices ->> 'eur', 0) * c.quantity_nonfoil + coalesce(sc.prices ->> 'eur_foil', 0) * c.quantity_foil,
        2
    ) AS value
FROM cards c
LEFT JOIN scryfall_cards sc
    ON c.set_code = sc.set_code
    AND c.collector_number = sc.collector_number
