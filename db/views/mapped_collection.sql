DROP VIEW IF EXISTS mapped_collection;
CREATE VIEW mapped_collection AS
SELECT
    coalesce(sc.name, 'Not found') AS card_name,
    c.set_code,
    c.collector_number,
    c.quantity_nonfoil,
    c.quantity_foil,
    c.quantity_nonfoil + c.quantity_foil AS total,
    sc.id AS scryfall_id
FROM cards c
LEFT JOIN scryfall_cards sc
    ON c.set_code = sc.set_code
    AND c.collector_number = sc.collector_number