from services.card_import import import_bulk_cards
from services.set_import import import_sets
import logging

if __name__ == "__main__":
    # DB_PATH = "C:\\Users\\manue\\AppData\\Roaming\\blisterpod-manager\\collection.db"
    DB_PATH = 'db/collection.db'
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(name)s - %(levelname)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    logger = logging.getLogger("Card importer")
    import_bulk_cards(DB_PATH, logger, exclude_filter={"digital": True, "set_codes": {"unk"}})
    import_sets(DB_PATH, logger, exclude_filter={"digital": True, "set_codes": {"unk"}})
