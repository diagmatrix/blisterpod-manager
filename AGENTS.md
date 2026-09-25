## Repo shape (high signal)

- Active app is Electron + React + TypeScript only: `src/main`, `src/preload`, `src/renderer`, `src/models`.
- Ignore `.opencode/` and `.claude/` for product work (tooling metadata/agent docs).
- DB schema source of truth is the versioned SQL files under `db/migrations/*.sql`, plus `db/views/*.sql`; named queries live in `db/queries/*.sql`. Never edit `.db` files directly.

## Commands you will actually run

- Dev: `npm run dev`
- Build: `npm run build`
- Preview packaged app: `npm run preview`
- Lint: `npm run lint` (or `npm run lint:fix`)
- Type-check all TS projects: `npx tsc -b`
- Unit + integration tests: `npm test` (watch: `npm run test:watch`, coverage: `npm run test:coverage`)
- End-to-end tests: `npm run test:e2e` (builds, rebuilds native deps for Electron, then runs Playwright)
- Package installer/app bundle: `npm run release` (add `-- --check` to gate on lint/tsc/tests, `-- --abi=node` to end Node-ABI/test-ready)

## Wiring and architecture gotchas

- Security boundary is enforced: renderer must use `window.api` from preload; `nodeIntegration: false` and `contextIsolation: true` are intentional in `src/main/index.ts`.
- IPC changes require synchronized edits in all layers: main handler(s), preload bridge (`src/preload/index.ts`), and renderer typings (`src/renderer/src/env.d.ts`, plus `src/models/*` types when needed).
- DB code lives in `src/main/db/`, split by domain (`cards`, `collection`, `duplicates`, `missing`, `stats`, `export`), each exporting a `register*Handlers(db)` wired together in `src/main/db/index.ts`; `querybuilder.ts` composes dynamic queries.
- `src/main/db/index.ts` `initDatabase()` runs the pending migrations, then `exec`s every `.sql` file in `db/views/`, so a new schema file is applied automatically (no array to update). Files in `db/queries/` are NOT auto-run — load them on demand with `readQueryFile('name.sql')`.
- SQL directory paths live in `src/main/db/paths.ts`, not `index.ts`. `migrations.ts` needs them too, and importing them from `index.ts` would be a cycle that leaves a module-level `const` in its temporal dead zone depending on evaluation order.
- Path alias is target-specific: main/preload (`electron.vite.config.ts`) map `@` to `src`, renderer maps `@` to `src/renderer/src`.
- About page copy is Markdown, not JSX: `src/renderer/src/content/*.md` plus the root `CHANGELOG.md`, all pulled in as strings by `src/renderer/src/content/index.ts` (`?raw`) and rendered by `@/components/Markdown`. The changelog is imported from the repo root on purpose — moving or renaming `CHANGELOG.md` breaks the renderer build. `Markdown.tsx` handles only headings, unordered lists, paragraphs and inline bold/code/links; anything else falls through as literal text, so add `react-markdown` rather than growing it if the copy ever needs tables or images.
- Router uses `HashRouter` (`src/renderer/src/App.tsx`); do not switch to browser-history routing without Electron packaging changes.

## Schema changes reach existing users only through migrations

- `db/migrations/NNN_description.sql` is the **only** description of the schema — there is no separate declarative copy to drift from it. Replaying the sequence from empty builds a fresh database; replaying it from a user's `PRAGMA user_version` brings theirs up to date. `NNN` is the version that file stamps.
- `runMigrations()` (`src/main/db/migrations.ts`) applies every file above the current `user_version` in numeric order, each in one transaction with its own stamp, and throws on failure. Migration files must not contain `BEGIN`/`COMMIT` — the runner owns the transaction.
- **Never edit a migration that has shipped.** It is inert for everyone who already ran it, so adding a column to `003_scryfall_cards.sql` reaches new installs only, silently, while existing users keep the old table. Every change is a new file with the next number. Renumbering after a release strands databases stamped at the old numbers.
- **Views need no migration** — every file in `db/views/` starts with `DROP VIEW IF EXISTS` and is rebuilt each launch. They run after the migrations so a view can select a column one just added.
- SQLite has **no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`** (that is MySQL/Postgres). It is a syntax error, `db.exec` throws, and `initDatabase()` rejecting takes `src/main/index.ts` straight to `app.quit()` — the app stops booting, fresh installs included. Plain `ADD COLUMN` in a versioned migration is what makes it safe to run once.
- **After each release, snapshot the schema into `tests/fixtures/schema/<version>.sql`** (ending with `PRAGMA user_version = N;` for what that release stamped) and never edit an existing snapshot. `migrations.test.ts` upgrades a database from every snapshot and requires the result to match a fresh install — that is what catches an edit to a shipped migration. A snapshot only guards the tables it contains, so one is not enough: `1.0.5.sql` predates `decks`, so it can say nothing about a column added to `decks` later.
- `tests/main/sqlite.ts` and `e2e/setup/launch.ts` both build databases from `db/migrations/`. The E2E launcher stamps `user_version` after seeding — without it the profile looks like version 0 and the app re-runs every migration on launch, where an `ADD COLUMN` fails as a duplicate.
- Ingest is column-driven — `refreshCards` builds its INSERT from `getTableColumns(db, 'scryfall_cards')` — so a new column self-populates on the next Scryfall refresh, but existing rows stay NULL until one runs. A column derived from data already stored (e.g. from `type_line`) should instead be backfilled with an `UPDATE` in its own migration, and needs a branch in `buildCardRow` alongside `set_code` and `collector_number_normalised`.

## Data rules that break features if missed

- Canonical join is `cards.(set_code, collector_number)` to `scryfall_cards.(set_code, collector_number)` (see `db/views/mapped_collection.sql`, `db/views/card_details.sql`).
- Scryfall field `set` is intentionally stored as `set_code` in DB ingest paths (`src/main/db/`, `src/main/scryfallRefresh.ts`).
- `cards` enforces quantity invariants in SQL: non-negative each, and combined quantity must be `> 0`.
- Many Scryfall structured fields are persisted as JSON text (serialized in TS); treat them as JSON strings at boundaries.
- Scryfall refresh logic intentionally excludes digital cards and set code `UNK`, and throttles requests by 100ms in API paging paths (`src/main/scryfallRefresh.ts`).
- **`card_types`/`card_subtypes` are empty until a card refresh runs.** `006_scryfall_cards_card_types.sql` adds the two columns and stops there, and the only thing that fills them is `refreshCards` — which the user triggers by hand. So on any database created before 006 the card type filter (`buildCardTypesCondition` in `querybuilder.ts`, the chips in `CardFilters`) matches nothing at all until a full Scryfall refresh. **The deferred fix is a migration that backfills both columns from `type_line`**, which has existed since 003, mirroring `parseCardTypes` in `src/main/scryfallRefresh.ts`: split faces on ` // `, split each face on the em dash `—` into types and subtypes, split those on spaces, dedupe, and store JSON arrays (`NULL`, not `[]`, when a face has no subtype section). Until then, treat "the filter returns nothing" as a stale-database symptom, not a query bug.

## Testing (and its known debt)

- Two Vitest projects, split because `@` resolves differently per target (see `vitest.workspace.ts`): `main` (node env, `src/main` + `src/models`) and `renderer` (jsdom env, `src/renderer`). Tests are colocated as `*.test.ts(x)`; only shared machinery lives in `tests/`.
- Harness lives in `tests/main/` (node side) and `tests/renderer/` (jsdom side). Keep that split — `tsconfig.node.json` and `tsconfig.web.json` include one directory each, and mixing them breaks `tsc -b`.
- `tests/main/sqlite.ts` builds a real in-memory DB by calling the app's own `runMigrations()` then applying `db/views/`; `tests/fixtures/collection.sql` is the shared seed (also used by the E2E launcher). Do not mock better-sqlite3 — running the real schema is the point.
- `tests/renderer/window-api.ts` is typed as the real `ElectronAPI`, so `npx tsc -b` fails if the preload bridge gains a method the mock lacks. That is intentional: it makes the "IPC changes require synchronized edits in all layers" rule compiler-enforced. Extend the mock when you extend the bridge.
- **better-sqlite3 ABI**: it is native, and the two test tiers need opposite builds. Vitest runs under plain Node (`npm run rebuild:node`); E2E and packaging need the Electron build (`npm run package:post`). A `NODE_MODULE_VERSION` error from either means you are on the wrong build — rebuild, do not debug the test.
- **The ABI marker can lie, and it used to ship broken installers.** `@electron/rebuild` records what it built in `node_modules/better-sqlite3/build/Release/.forge-meta` (e.g. `x64--128`) and skips any module whose marker already names the target ABI. `npm rebuild` replaces the `.node` without touching that marker, so a Node-ABI binary behind an Electron-ABI marker makes electron-builder's automatic rebuild a silent no-op — the installer then dies on launch with `NODE_MODULE_VERSION 137 ... requires 128`. Two guards now exist: `rebuild:node` deletes the marker after building, and `scripts/release.mjs` forces `package:post` immediately before `electron-builder`. Keep both; either alone leaves a hole for anyone running `npx electron-builder` by hand.
- E2E isolation uses Electron's `--user-data-dir` switch, which relocates both the database and the electron-store settings to a temp profile. The launcher pre-seeds it so the app never enters the Scryfall download path.

### Deliberate shortcuts, and the fix each one defers

The main-process tests do not run in Electron. They work because `tests/main/electron-stub.ts` is aliased over the `electron` module (and `electron-log-stub.ts` over `electron-log/main.js`). This is *interim scaffolding with a known exit path*, not the intended end state — it exists so tests could start without a big-bang refactor. Three things it papers over, worth fixing now that a suite exists to catch regressions:

1. `src/main/utils.ts` evaluates `app.getVersion()` at module load for `USER_AGENT`. Make it a lazy function.
2. `src/main/logger.ts` runs `log.initialize()`, `app.getPath()` and `app.isPackaged` at module load. Move them behind an explicit `initLogger()`.
3. Every `ipcMain.handle` body in `src/main/db/*.ts` is an anonymous closure with no other entry point, reachable only because the stub records handlers into a Map for `tests/main/ipc-harness.ts` to replay. Extract each into a named exported function that `register*Handlers` merely wires up.

Each fix lets the corresponding stub get thinner. Tests written against the stubs should keep passing throughout — that is what makes them safe to do.

## Verification expectations

- No CI workflows are present; run checks manually before finishing.
- Minimum safe pass after code changes: `npm run lint` -> `npx tsc -b` -> `npm test` -> `npm run build`.
- After schema/query edits, verify dependent views still match table columns and join keys.
- Runtime DB path defaults to Electron `app.getPath('userData')/collection.db` (not repo-local `db/collection.db`), so validate against the app-run database unless you intentionally change path logic.
- Under `npm run dev` the file name switches to `test_collection.db` (`NODE_ENV=development`, set by electron-vite), so dev runs get their own database. `npm run build`/`preview`/E2E and packaged builds all use `collection.db`. A dev run therefore starts empty on first launch and will enter the Scryfall download path.
