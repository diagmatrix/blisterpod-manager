DROP VIEW IF EXISTS scryfall_sets_formatted;
CREATE VIEW scryfall_sets_formatted AS
SELECT
    *,
    CASE
        -- Wizards play network
        WHEN coalesce(name, '') LIKE 'Wizards Play Network%'
            THEN 'SLD'
        -- Universes within
        WHEN coalesce(name, '') = 'Universes Within'
            THEN coalesce(parent_set_code, code)
        -- Promos and tokens from sets
        WHEN coalesce(set_type, '') IN ('promo', 'token')
            THEN coalesce(parent_set_code, code)
        ELSE
            code
    END AS base_set_code
FROM scryfall_sets
