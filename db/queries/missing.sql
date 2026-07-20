DROP VIEW IF EXISTS missing;
CREATE VIEW missing AS
WITH sets_with_cards AS (
    SELECT
        DISTINCT set_code
    FROM scryfall_cards
)
SELECT
    mc.collection_id,
    mc.set_code,
    mc.collector_number,
    mc.quantity_foil,
    mc.quantity_nonfoil,
    swc.set_code IS NULL AS set_cards_missing,
    ss.id IS NULL        AS set_metadata_missing
FROM mapped_collection mc
LEFT JOIN sets_with_cards swc
    ON mc.set_code = swc.set_code
LEFT JOIN scryfall_sets ss
    ON mc.set_code = ss.code
WHERE
    mc.scryfall_id IS NULL
    OR ss.id IS NULL
