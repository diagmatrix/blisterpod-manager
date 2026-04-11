# Blisterpod manager

A way for me to sort my MTG collection and to try the AI psychosis going on worldwide.

# Database structure

Main databse: kozilek.db
Collection database: collection.db
Scryfall cards databse: scryfall.db

Inside the main database, you will have to run:

````sql
ATTACH DATABASE 'collection.db' AS collection;
ATTACH DATABASE 'scryfall.db' AS scryfall;
```
