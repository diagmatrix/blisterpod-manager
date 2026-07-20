SELECT
    set_code,
    collector_number,
    quantity_nonfoil,
    quantity_foil,
    created_at,
    updated_at
FROM cards
ORDER BY set_code, collector_number
