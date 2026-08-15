UPDATE decks 
SET 
    name = ?, 
    format = ?, 
    folder = ?,
    in_use = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE 
    id = ?
