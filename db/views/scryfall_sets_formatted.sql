DROP VIEW IF EXISTS scryfall_sets_formatted;
CREATE VIEW scryfall_sets_formatted AS
SELECT
    *,
    CASE
        -- Wizards play network
        WHEN coalesce(name, '') LIKE 'Wizards Play Network%'
            THEN 'SLD'
        -- Love your LGS
        WHEN coalesce(name, '') LIKE 'Love Your LGS%'
            THEN 'SLD'
        -- Store Championships
        WHEN coalesce(name, '') = 'Store Championships'
            THEN 'SLD'
        -- Judge promos 2000-2011
        WHEN code BETWEEN 'G00' AND 'G11'
            THEN 'DCI'
        -- Judge promos 2012-2019
        WHEN code BETWEEN 'J12' AND 'J19'
            THEN 'SLD'
        -- Judge promos 2021-2023
        WHEN code IN ('PJ21', 'P22', 'P23')
            THEN 'J20'
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
