DELETE FROM cards WHERE id IN (
    SELECT 
        id 
    FROM (
        SELECT 
            id, 
            row_number() OVER (PARTITION BY set_code, collector_number ORDER BY id) AS rn
        FROM cards
    ) 
    WHERE 
        rn > 1
)
