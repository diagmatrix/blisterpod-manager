from services.card_import import import_bulk_cards
import logging

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(name)s - %(levelname)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    logger = logging.getLogger("Card importer")
    import_bulk_cards("./db/collection.db", logger, exclude_filter={"digital": True, "set_codes": {"unk"}})
