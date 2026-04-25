DROP VIEW IF EXISTS duplicates;
CREATE VIEW duplicates AS
WITH duplicate_card_entries AS (
    SELECT
        set_code,
        collector_number,
        count(*) AS row_count,
        sum(quantity_nonfoil) AS total_nonfoil,
        sum(quantity_foil) AS total_foil,
        string_agg(id, ', ') AS row_ids
    FROM cards
    GROUP BY set_code, collector_number
    HAVING count(*) > 1
)
SELECT
    dce.*,
    coalesce(sc.name, dce.set_code || ' #' || dce.collector_number) AS name
FROM duplicate_card_entries dce
LEFT JOIN scryfall_cards sc
    ON dce.set_code = sc.set_code
    AND dce.collector_number = sc.collector_number
