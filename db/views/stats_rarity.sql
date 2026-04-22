DROP VIEW IF EXISTS stats_rarity;
CREATE VIEW stats_rarity AS
SELECT
    coalesce(rarity, 'unknown') AS rarity,
    sum(total)                  AS total_cards
FROM mapped_collection
GROUP BY rarity
