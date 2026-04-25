DROP VIEW IF EXISTS card_details;
CREATE VIEW card_details AS
WITH card_faces AS (
    SELECT
        sc.id,
        faces.value ->> 'mana_cost'               AS mana_cost,
        faces.value ->> 'oracle_text'             AS oracle_text,
        faces.value ->> 'image_uris' ->> 'normal' AS image_url,
        faces.value ->> 'type_line'               AS face_type_line,
        faces.value ->> 'oracle_id'               AS oracle_id
    FROM scryfall_cards sc
    INNER JOIN json_each(sc.card_faces) faces
),
card_faces_aggregated AS (
    SELECT
        id,
        '["' || string_agg(mana_cost, '", "') || '"]'   AS mana_costs,
        '["' || string_agg(oracle_text, '", "') || '"]' AS oracle_texts,
        '["' || string_agg(image_url, '", "') || '"]'   AS image_urls,
        string_agg(face_type_line, ' // ')              AS type_line,
        min(oracle_id)                                  AS oracle_id
    FROM card_faces
    GROUP BY id
)
SELECT
    sc.id AS scryfall_id,
    coalesce(sc.oracle_id, cfa.oracle_id) AS oracle_id,
    sc.name,
    CASE
        WHEN sc.mana_cost IS NULL AND cfa.id IS NOT NULL
            THEN cfa.mana_costs
        ELSE
            json_array(sc.mana_cost)
    END                                   AS mana_costs,
    sc.set_code,
    sc.collector_number,
    sc.set_name,
    CASE
        WHEN cfa.id IS NOT NULL
            THEN cfa.type_line
        ELSE
            sc.type_line
    END                                   AS type_line,
    CASE
        WHEN cfa.id IS NOT NULL
            THEN cfa.oracle_texts
        ELSE
            json_array(sc.oracle_text)
    END                                   AS oracle_texts,
    CASE
        WHEN cfa.id IS NOT NULL
            THEN cfa.image_urls
        ELSE
            json_array(sc.image_uris ->> 'normal')
    END                                   AS image_urls,
    sc.color_identity,
    sc.rarity,
    CASE
        WHEN sc.set_type = 'token'
            THEN true
        ELSE false
    END                                   AS is_token,
    c.quantity_foil,
    c.quantity_nonfoil,
    round(
        coalesce(sc.prices ->> 'eur', 0) * c.quantity_nonfoil + coalesce(sc.prices ->> 'eur_foil', 0) * c.quantity_foil,
        2
    )                                     AS value
FROM cards c
INNER JOIN scryfall_cards sc
    ON c.set_code = sc.set_code
    AND c.collector_number = sc.collector_number
LEFT JOIN card_faces_aggregated cfa
    ON sc.id = cfa.id
