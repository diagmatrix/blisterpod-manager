SELECT
    c.set_code,
    c.collector_number,
    c.quantity_foil,
    c.quantity_nonfoil,
    mc.name,
    mc.scryfall_id,
    coalesce(c.updated_at, c.created_at) AS added_at
FROM mapped_collection mc
INNER JOIN cards c
    ON mc.set_code = c.set_code
    AND mc.collector_number = c.collector_number
WHERE
    mc.scryfall_id IS NOT NULL
ORDER BY c.set_code, c.collector_number
