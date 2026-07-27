INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil, created_at, updated_at) 
VALUES (?, ?, ?, ?, coalesce(?, CURRENT_TIMESTAMP), coalesce(?, CURRENT_TIMESTAMP))
