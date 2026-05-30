DROP VIEW IF EXISTS stats_by_set;
CREATE VIEW stats_by_set AS
WITH sets_aggregated AS (
    SELECT
        c.set_code,
        coalesce(ssf.name, c.set_code)                  AS set_name,
        coalesce(ssf.base_set_code, c.set_code)         AS base_set_code,
        sum(c.quantity_nonfoil + c.quantity_foil)       AS total_cards,
        count(DISTINCT c.id)                            AS unique_printings,
        coalesce(ssf.card_count, count(DISTINCT c.id))  AS set_cards,
        coalesce(ssf.released_at, CURRENT_DATE)         AS released_at
    FROM cards c
    LEFT JOIN scryfall_sets_formatted ssf
        ON c.set_code = ssf.code
    WHERE
        ssf.set_type NOT IN ('token', 'promo')
    GROUP BY c.set_code
)
SELECT
    *,
    trunc(100 * cast(unique_printings AS real) / set_cards) AS percentage_collected
FROM sets_aggregated
