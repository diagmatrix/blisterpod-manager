SELECT 
    id, 
    quantity_nonfoil, 
    quantity_foil 
FROM cards 
WHERE 
    set_code = ? 
    AND collector_number = ? 
ORDER BY id ASC
