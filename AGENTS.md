## What this repo is today

- This is a hybrid codebase: Electron app is active (`src/main`, `src/preload`, `src/renderer`) and Python importer is still used to populate Scryfall data.
- `requirements/SPEC.md` and `requirements/BM-*.md` drive feature scope/tasks; check them before implementing BM-labeled UI/IPC work.
- Ignore `.opencode/` and `.claude/` for product changes (tool metadata/agent docs).

## Commands you will actually use

- Electron dev: `npm run dev`
- Electron build: `npm run build`
- Electron preview: `npm run preview`
- TypeScript check (no script provided): `npx tsc -b`
- Python deps: `python -m pip install -r requirements.txt`
- Bulk import into SQLite: `python main.py`

## Data and schema rules (easy to break)

- SQL files in `db/tables/*.sql` and `db/views/*.sql` are the schema source of truth; do not hand-edit `db/*.db`.
- The canonical join between `cards` and `scryfall_cards` is `(set_code, collector_number)`.
- `set` from Scryfall is intentionally renamed to `set_code` in storage/import logic; keep importer + SQL aligned.
- `cards` constraints are enforced in DB: `quantity_nonfoil >= 0`, `quantity_foil >= 0`, and total quantity > 0.
- `scryfall_cards` JSON-like fields are stored as JSON strings/text; parse before renderer use.

## Electron wiring gotchas

- Renderer must go through preload only (`window.api` from `src/preload/index.ts`); keep `nodeIntegration: false` and `contextIsolation: true`.
- If you add or rename IPC channels, update all three: `src/main/*.ts` handler, `src/preload/index.ts` bridge, and `src/renderer/src/env.d.ts` + shared types.
- `src/main/db.ts` currently executes a hardcoded SQL file list at startup (not directory globbing). If you add SQL files, also add them to those arrays.
- Path alias differs by target: main/preload use `@ -> src`, renderer uses `@ -> src/renderer/src`.

## Python importer gotchas

- `main.py` imports with `exclude_filter={"digital": True, "set_codes": {"unk"}}`; preserve behavior unless intentionally changing import policy.
- `ScryfallClient` applies a 100ms delay between requests and accepts full URLs unchanged (used for `download_uri`).

## Verification expectations

- There is no CI, lint config, or test suite configured; validate manually.
- Minimum safe checks after changes: run `npx tsc -b`, run `npm run build`, and for importer/schema work run `python main.py` against local `db/collection.db`.
- After SQL changes, verify dependent views still match table columns (especially join keys and JSON field usage).
