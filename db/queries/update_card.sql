UPDATE cards 
SET 
    quantity_nonfoil = ?, 
    quantity_foil = ?, 
    updated_at = CURRENT_TIMESTAMP 
WHERE 
    id = ?
