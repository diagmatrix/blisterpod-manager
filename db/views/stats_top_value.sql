DROP VIEW IF EXISTS stats_top_value;
CREATE VIEW stats_top_value AS
SELECT
    mc.*,
    coalesce(ss.name, mc.set_name) AS set_name
FROM mapped_collection