DROP VIEW IF EXISTS stats_summary;
CREATE VIEW stats_summary AS
SELECT
    count(DISTINCT set_code || '#' || collector_number) AS unique_printings,
    count(DISTINCT name)                                AS unique_names,
    sum(total)                                          AS total_cards,
    round(sum(value), 2)                                AS estimated_value
FROM main.mapped_collection
