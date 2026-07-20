SELECT
    name,
    set_code,
    collector_number,
    quantity_nonfoil,
    quantity_foil
FROM mapped_collection
WHERE
    scryfall_id IS NOT NULL
ORDER BY set_code, collector_number
