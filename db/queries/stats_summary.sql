SELECT
    count(DISTINCT set_code || '#' || collector_number) AS uniquePrintings,
    count(DISTINCT name)                                AS uniqueNames,
    coalesce(sum(total), 0)                             AS totalCards,
    coalesce(round(sum(value), 2), 0)                   AS estimatedValue
FROM main.mapped_collection
