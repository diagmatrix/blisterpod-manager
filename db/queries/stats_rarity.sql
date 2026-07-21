SELECT
    coalesce(rarity, 'unknown') AS rarity,
    coalesce(sum(total), 0)     AS totalCards
FROM mapped_collection
GROUP BY rarity
