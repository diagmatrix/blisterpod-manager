WITH card_colors AS (
    SELECT
        name,
        total,
        count(colors.value)          AS total_colors,
        string_agg(colors.value, '') AS color_category
    FROM mapped_collection
    INNER JOIN json_each(CASE WHEN color_identity = '[]' THEN '["C"]' ELSE color_identity END) colors
    GROUP BY name, total
)
SELECT
    sum(CASE WHEN color_category = 'W' THEN total ELSE 0 END) AS white,
    sum(CASE WHEN color_category = 'U' THEN total ELSE 0 END) AS blue,
    sum(CASE WHEN color_category = 'B' THEN total ELSE 0 END) AS black,
    sum(CASE WHEN color_category = 'R' THEN total ELSE 0 END) AS red,
    sum(CASE WHEN color_category = 'G' THEN total ELSE 0 END) AS green,
    sum(CASE WHEN color_category = 'C' THEN total ELSE 0 END) AS colorless,
    sum(CASE WHEN total_colors > 1 THEN total ELSE 0 END) AS multicolored
FROM card_colors
