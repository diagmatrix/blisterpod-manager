DELETE FROM scryfall_cards
WHERE 
    NOT EXISTS (
        SELECT
            id 
        FROM refresh_scryfall_ids
        WHERE 
            refresh_scryfall_ids.id = scryfall_cards.id
    )
    AND NOT EXISTS (
        SELECT 
            id
        FROM cards
        WHERE cards.set_code = scryfall_cards.set_code
          AND cards.collector_number = scryfall_cards.collector_number
    )
