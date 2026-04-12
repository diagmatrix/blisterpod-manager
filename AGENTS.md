## Repo shape

The planned architecture (per `requirements/SPEC.md`) is an **Electron + React + TypeScript** desktop app. The Python code is the **current** implementation; the Electron app does not exist yet. Both will coexist: Python handles Scryfall bulk import (run manually), Electron handles the UI and DB access.

- Current source: `main.py`, `services/*.py`, `db/tables/*.sql`, `db/views/*.sql`.
- Planned Electron source (not yet scaffolded): `src/main/`, `src/preload/`, `src/renderer/`.
- Ignore `.opencode/` for product work (local tool metadata only).
- `requirements/` (gitignored) contains feature specs (`BM-01` … `BM-08`) and `SPEC.md`; read them before implementing any UI feature.

## Source of truth

- SQL files in `db/tables/` and `db/views/` are the authoritative schema.
- Single database: `db/collection.db`. Multi-DB `ATTACH` is not used.
- Do not hand-edit `db/*.db`; they are gitignored runtime artifacts.

## Python import pipeline (current)

- Install: `python -m pip install -r requirements.txt` (only `requests` and `ijson`).
- Run: `python main.py` — streams Scryfall `default_cards` bulk JSON into `db/collection.db`.
- `services/card_import.py` maps Scryfall's `set` key → `set_code` (because `set` is a reserved SQL word); schema and importer must stay aligned on this rename.
- `services/scryfall_client.py` extends `requests.Session`; rate-limit is 100 ms between requests; passes full URLs through unchanged (no double-prefixing).

## Schema constraints that matter

- `scryfall_cards.set_code` replaces Scryfall's `set` field — intentional, keep it.
- Join key between `cards` and `scryfall_cards` is always `(set_code, collector_number)`. Both tables have indexes on this pair.
- `cards` enforces: `quantity_nonfoil >= 0`, `quantity_foil >= 0`, `total > 0`. All writes must respect these or catch the constraint error.
- `db/views/duplicates.sql` uses `string_agg(...)` — SQLite < 3.44 does not have `string_agg`; keep this in mind if targeting older SQLite bundles.
- `scryfall_cards` columns that hold JSON objects/arrays (`image_uris`, `prices`, `legalities`, `card_faces`, etc.) are stored as serialized JSON strings — parse them before use.

## Planned Electron app (SPEC.md)

- Build tool: `electron-vite`.
- DB access from main process only via `better-sqlite3` (synchronous). Renderer accesses DB exclusively through `contextBridge` IPC. `nodeIntegration: false`, `contextIsolation: true`.
- On startup, the main process must read and execute all `.sql` files from `db/tables/` and `db/views/` to ensure schema is current (NBM-03).
- UI: React 18 + TypeScript + shadcn/ui (Radix UI + Tailwind CSS). Charts: recharts. Virtual scrolling: `@tanstack/react-virtual`. Async IPC state: `@tanstack/react-query`.
- IPC channel naming convention: `db:collection:list`, `db:cards:search`, `db:stats:summary`, etc. — see `requirements/SPEC.md` §7 for the full typed API reference.
- Settings persistence: `electron-store` or a JSON file in `app.getPath('userData')`.
- Image cache path: `{userData}/image-cache/{scryfall_id}.jpg`.
- Primary platform target: Windows. Do not actively break macOS/Linux.

## Verification

- No automated tests or CI. Verification is manual.
- After changing SQL, cross-check dependent views (`db/views/*.sql`) against table definitions for column name and type consistency, especially on `set_code` and `collector_number`.
- After changing `card_import.py`, verify the `set` → `set_code` mapping is intact.
