from .scryfall_client import ScryfallClient, ScryfallApiError
import sqlite3
import logging
import json
import decimal
from typing import Optional, Dict, Any, TypedDict

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
    cursor.execute(f"PRAGMA table_info(scryfall_sets)")
    return {row[1] for row in cursor.fetchall()}

def parse_set_data(card_json: Dict, columns: set, logger: logging.Logger) -> Optional[Dict]:
    """Parse relevant fields from the Scryfall set JSON."""
    id = card_json.get("id")
    if not id:
        logger.warning("Set JSON missing 'id' field, skipping.")
        return None

    mtg_set = make_serializable(card_json)
    if "code" in mtg_set:
        mtg_set["code"] = mtg_set["code"].upper()
    if "parent_set_code" in mtg_set:
        mtg_set["parent_set_code"] = mtg_set["parent_set_code"].upper()

    missing_columns = columns - mtg_set.keys()
    if missing_columns and logger.isEnabledFor(logging.DEBUG):
        logger.debug(f"Columns {', '.join(missing_columns)} not found in set data, setting to None")

    for col in missing_columns:
        mtg_set[col] = None

    return mtg_set

def insert_batch(cursor: sqlite3.Cursor, batch: list[Dict], columns: set, logger: logging.Logger) -> None:
    """Insert a batch of sets into the database."""
    placeholders = ", ".join(f":{col}" for col in columns)
    column_names = ", ".join(columns)
    logger.info(f"Inserting batch of {len(batch)} sets into database")
    cursor.executemany(f"INSERT INTO scryfall_sets ({column_names}) VALUES ({placeholders}) ON CONFLICT(id) DO NOTHING", batch)

def import_sets(db_path: str, logger: logging.Logger, batch_size: int = 1000, exclude_filter: Optional[ExcludeFilter] = None) -> None:
    """Main function to import sets from Scryfall into the database."""
    logger.info("Starting bulk set import")
    SETS_ENDPOINT = "/sets"
    conn = connect_db(db_path, logger)
    if not conn:
        return

    cursor = conn.cursor()
    columns = get_table_columns(cursor)
    client = ScryfallClient()

    has_more = True
    try:
        while has_more:
            resp = client.get(SETS_ENDPOINT)
            has_more = resp.json().get("has_more", False)
            
            sets_data = resp.json().get("data", [])
            if not sets_data:
                logger.warning("No set data found in response, stopping import.")
                has_more = False
                continue
            
            batch = []
            for set_json in sets_data:
                parsed_set = parse_set_data(set_json, columns, logger)
                if parsed_set:
                    if exclude_filter:
                        if exclude_filter.get("digital") and parsed_set.get("digital"):
                            logger.debug(f"Excluding digital set: {parsed_set.get('name')}")
                            continue
                        if "set_codes" in exclude_filter and parsed_set.get("code", "").upper() in exclude_filter["set_codes"]:
                            logger.debug(f"Excluding set with code {parsed_set.get('code')}: {parsed_set.get('name')}")
                            continue
                    batch.append(parsed_set)

                if len(batch) >= batch_size:
                    insert_batch(cursor, batch, columns, logger)
                    conn.commit()
                    batch.clear()

            # Insert any remaining sets
            if batch:
                insert_batch(cursor, batch, columns, logger)
                conn.commit()
        logger.info("Finished importing all sets into database")
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
