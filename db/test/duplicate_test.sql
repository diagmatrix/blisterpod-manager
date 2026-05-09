INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES
('GTC', '54', 1, 0),
('GTC', '54', 1, 0),
('GTC', '54', 1, 0),
('GTC', '54', 0, 1),
('GTC', '54', 0, 1),
('GTC', '54', 0, 1);

INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES
('BFZ', '163', 1, 0),
('BFZ', '163', 1, 0),
('BFZ', '163', 1, 0),
('BFZ', '163', 0, 1),
('BFZ', '163', 0, 1),
('BFZ', '163', 0, 1);

DELETE FROM cards
WHERE
    (set_code = 'GTC' AND collector_number = '54')
    OR (set_code = 'BFZ' AND collector_number = '163');
