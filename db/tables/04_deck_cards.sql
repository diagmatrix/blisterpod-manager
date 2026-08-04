CREATE TABLE IF NOT EXISTS deck_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER REFERENCES decks (id),
    oracle_id TEXT NOT NULL,
    preferred_printing TEXT REFERENCES scryfall_cards(id),
    zone TEXT NOT NULL,
    quantity_nonfoil INTEGER NOT NULL DEFAULT 0,
    quantity_foil INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT quantity_nonfoil_not_negative CHECK ( quantity_nonfoil >= 0 ),
    CONSTRAINT quantity_foil_not_negative CHECK ( quantity_foil >= 0 ),
    CONSTRAINT quantity_more_than_zero CHECK ( quantity_nonfoil + quantity_foil > 0 )
);
