## Repo shape (high signal)

- Active app is Electron + React + TypeScript only: `src/main`, `src/preload`, `src/renderer`, `src/shared`.
- Ignore `.opencode/` and `.claude/` for product work (tooling metadata/agent docs).
- DB schema source of truth is SQL files under `db/tables/*.sql` and `db/views/*.sql`; never edit `.db` files directly.

## Commands you will actually run

- Dev: `npm run dev`
- Build: `npm run build`
- Preview packaged app: `npm run preview`
- Lint: `npm run lint` (or `npm run lint:fix`)
- Type-check all TS projects: `npx tsc -b`
- Package installer/app bundle: `npm run package`

## Wiring and architecture gotchas

- Security boundary is enforced: renderer must use `window.api` from preload; `nodeIntegration: false` and `contextIsolation: true` are intentional in `src/main/index.ts`.
- IPC changes require synchronized edits in all layers: main handler(s), preload bridge (`src/preload/index.ts`), and renderer typings (`src/renderer/src/env.d.ts`, plus `src/shared/*` types when needed).
- `src/main/db.ts` initializes schema from hardcoded SQL filename arrays; adding a new SQL file requires adding it to those arrays or it will never execute.
- Path alias is target-specific: main/preload (`electron.vite.config.ts`) map `@` to `src`, renderer maps `@` to `src/renderer/src`.
- Router uses `HashRouter` (`src/renderer/src/App.tsx`); do not switch to browser-history routing without Electron packaging changes.

## Data rules that break features if missed

- Canonical join is `cards.(set_code, collector_number)` to `scryfall_cards.(set_code, collector_number)` (see `db/views/mapped_collection.sql`, `db/views/card_details.sql`).
- Scryfall field `set` is intentionally stored as `set_code` in DB ingest paths (`src/main/db.ts`, `src/main/scryfallRefresh.ts`).
- `cards` enforces quantity invariants in SQL: non-negative each, and combined quantity must be `> 0`.
- Many Scryfall structured fields are persisted as JSON text (serialized in TS); treat them as JSON strings at boundaries.
- Scryfall refresh logic intentionally excludes digital cards and set code `UNK`, and throttles requests by 100ms in API paging paths (`src/main/scryfallRefresh.ts`).

## Verification expectations

- No CI workflows are present; run checks manually before finishing.
- Minimum safe pass after code changes: `npm run lint` -> `npx tsc -b` -> `npm run build`.
- After schema/query edits, verify dependent views still match table columns and join keys.
- Runtime DB path defaults to Electron `app.getPath('userData')/collection.db` (not repo-local `db/collection.db`), so validate against the app-run database unless you intentionally change path logic.
