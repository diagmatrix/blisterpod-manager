DROP VIEW IF EXISTS duplicates;
CREATE VIEW duplicates AS
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