CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_code TEXT NOT NULL,
    collector_number TEXT NOT NULL,
    quantity_nonfoil INTEGER NOT NULL DEFAULT 0,
    quantity_foil INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    CONSTRAINT quantity_nonfoil_not_negative CHECK ( quantity_nonfoil >= 0 ),
    CONSTRAINT quantity_foil_not_negative CHECK ( quantity_foil >= 0 ),
    CONSTRAINT quantity_more_than_zero CHECK ( quantity_nonfoil + quantity_foil > 0 )
);

CREATE INDEX IF NOT EXISTS cards_set_number ON cards (set_code, collector_number);
