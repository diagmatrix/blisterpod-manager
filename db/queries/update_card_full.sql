UPDATE cards 
SET 
    set_code = ?, 
    collector_number = ?,
    quantity_nonfoil = ?, 
    quantity_foil = ?, 
    updated_at = CURRENT_TIMESTAMP 
WHERE 
    id = ?
