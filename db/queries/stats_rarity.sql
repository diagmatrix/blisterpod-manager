SELECT
    coalesce(rarity, 'unknown') AS rarity,
    sum(total)                  AS total_cards
FROM mapped_collection
GROUP BY rarity
