WITH sums AS (
SELECT 
    min(id)               AS keep_id,
    sum(quantity_nonfoil) AS total_nonfoil,
    sum(quantity_foil)    AS total_foil
FROM cards
GROUP BY set_code, collector_number
HAVING 
    count(*) > 1
)
UPDATE cards
SET 
    quantity_nonfoil = sums.total_nonfoil,
    quantity_foil = sums.total_foil,
    updated_at = CURRENT_TIMESTAMP
FROM sums
WHERE 
    cards.id = sums.keep_id
