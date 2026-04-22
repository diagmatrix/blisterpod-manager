DROP VIEW IF EXISTS stats_by_set;
CREATE VIEW stats_by_set AS
SELECT
    c.set_code,
    coalesce(ss.name, c.set_code)                 AS set_name,
    CASE
        WHEN coalesce(ss.set_type, '') IN ('promo', 'token')
            OR coalesce(ss.name, '') = 'Universes Within'
            THEN coalesce(ss.parent_set_code, c.set_code)
        ELSE c.set_code
    END                                            AS base_set_code,
    sum(c.quantity_nonfoil + c.quantity_foil)      AS total_cards,
    count(DISTINCT c.id)                           AS unique_printings,
    coalesce(ss.card_count, count(DISTINCT c.id))  AS set_cards,
    coalesce(ss.released_at, CURRENT_DATE)         AS released_at
FROM cards c
LEFT JOIN scryfall_sets ss
    ON c.set_code = ss.code
GROUP BY c.set_code
