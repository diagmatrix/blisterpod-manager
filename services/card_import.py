from .scryfall_client import ScryfallClient, ScryfallApiError
import sqlite3
import logging
import json
import ijson
import decimal
from typing import Optional, Dict, TypedDict, Any

class ExcludeFilter(TypedDict):
    """TypedDict for filtering out cards"""
    digital: bool
    set_codes: set[str]

def connect_db(db_path: str, logger: logging.Logger) -> Optional[sqlite3.Connection]:
    """Connect to the SQLite database."""
    try:
        return sqlite3.connect(db_path)
    except sqlite3.Error as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def make_serializable(card: Dict) -> Dict:
    """Convert non-serializable fields to serializable types."""
    def normalize(value: Any) -> Any:
        if isinstance(value, decimal.Decimal):
            return int(value) if value == value.to_integral_value() else float(value)
        if isinstance(value, dict):
            return {k: normalize(v) for k, v in value.items()}
        if isinstance(value, list):
            return [normalize(item) for item in value]
        return value

    serialized_card = {}
    for k, v in card.items():
        normalized = normalize(v)
        if isinstance(normalized, (dict, list)):
            serialized_card[k] = json.dumps(normalized, ensure_ascii=True)
        else:
            serialized_card[k] = normalized

    return serialized_card

def get_table_columns(cursor: sqlite3.Cursor) -> set:
    """Get the set of column names for a given table."""
    cursor.execute(f"PRAGMA table_info(scryfall_cards)")
    return {row[1] for row in cursor.fetchall()}

def parse_card_data(card_json: Dict, columns: set, logger: logging.Logger) -> Optional[Dict]:
    """Parse relevant fields from the Scryfall card JSON."""
    id = card_json.get("id")
    if not id:
        logger.warning("Card JSON missing 'id' field, skipping.")
        return None

    card = make_serializable(card_json)
    if "set" in card:
        card["set_code"] = card["set"].upper()
        card.pop("set", None)  # Remove 'set' from the JSON to avoid redundancy

    missing_columns = columns - card.keys()
    if missing_columns and logger.isEnabledFor(logging.DEBUG):
        logger.debug(f"Columns {', '.join(missing_columns)} not found in card data, setting to None")

    for col in missing_columns:
        card[col] = None

    return card

def insert_batch(cursor: sqlite3.Cursor, batch: list[Dict], columns: set, logger: logging.Logger) -> None:
    """Insert a batch of cards into the database."""
    placeholders = ", ".join(f":{col}" for col in columns)
    column_names = ", ".join(columns)
    logger.info(f"Inserting batch of {len(batch)} cards into database")
    cursor.executemany(f"INSERT INTO scryfall_cards ({column_names}) VALUES ({placeholders}) ON CONFLICT(id) DO NOTHING", batch)

def import_bulk_cards(db_path: str, logger: logging.Logger, batch_size: int = 1000, exclude_filter: Optional[ExcludeFilter] = None) -> None:
    """Import bulk card data from Scryfall into the local database."""
    logger.info("Starting bulk card import")
    BULK_ENDPOINT = "/bulk-data/default_cards"
    conn = connect_db(db_path, logger)
    if not conn:
        return

    client = ScryfallClient()
    try:
        cursor = conn.cursor()
        columns = get_table_columns(cursor)

        bulk_meta = client.get(BULK_ENDPOINT)
        bulk_data_uri = bulk_meta.json().get("download_uri")
        if not bulk_data_uri:
            logger.error("Bulk data URI not found in response.")
            return

        batch = []
        with client.get(bulk_data_uri, stream=True) as response:
            response.raw.decode_content = True
            objects = ijson.items(response.raw, "item")
            for card_json in objects:
                parsed_card = parse_card_data(card_json, columns, logger)
                if parsed_card:
                    if exclude_filter:
                        if exclude_filter.get("digital") and parsed_card.get("digital"):
                            logger.debug(f"Excluding digital card: {parsed_card.get('name', 'unknown')} ({parsed_card.get('set_code', 'unknown')})")
                            continue
                        if exclude_filter.get("set_codes") and parsed_card.get("set_code") in exclude_filter["set_codes"]:
                            logger.debug(f"Excluding card from set {parsed_card.get('set_code')}: {parsed_card.get('name', 'unknown')}")
                            continue
                    batch.append(parsed_card)
                
                if len(batch) >= batch_size:
                    logger.info(f"Retrieved batch of {len(batch)} cards")
                    insert_batch(cursor, batch, columns, logger)
                    conn.commit()
                    batch = []

        if batch:
            logger.info(f"Retrieved batch of {len(batch)} cards")
            insert_batch(cursor, batch, columns, logger)
            conn.commit()

        logger.info("Finished importing all cards into database")
    except ScryfallApiError as e:
        logger.error(f"Scryfall API error during bulk import: {e}")
        conn.rollback()
    except sqlite3.Error as e:
        logger.error(f"Database error during bulk import: {e}")
        conn.rollback()
    except Exception as e:
        logger.error(f"Unexpected error during bulk data processing: {e}")
        conn.rollback()
    finally:
        conn.close()
        client.close()
