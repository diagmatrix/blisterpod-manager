SELECT
    *
FROM mapped_collection
WHERE
    oracle_id = ? 
    AND scryfall_id != ? 
ORDER BY total DESC, set_code, collector_number_normalised
