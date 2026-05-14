# Blisterpod Manager

A desktop app to track and manage your Magic: The Gathering card collection. Built as a personal way to sort my MTG collection (and to try the AI psychosis going on worldwide).

Card data is sourced from [Scryfall](https://scryfall.com/) and stored locally in a SQLite database, so the app works fully offline once cards have been imported.

## Features

- Browse and search your collection with filtering by color, set, rarity, etc.
- Add cards individually or in bulk, with separate counts for regular and foil.
- View card details, including pricing and printings.
- Dashboard with collection stats and charts.
- Refresh card data from Scryfall on demand.
- Surface and resolve cards that fail to map against Scryfall data.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (via [shadcn/ui](https://ui.shadcn.com/) conventions)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for local storage
- [@tanstack/react-query](https://tanstack.com/query) and [@tanstack/react-virtual](https://tanstack.com/virtual)
- [Recharts](https://recharts.org/) for dashboard visualizations

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (the project targets recent LTS)
- npm 10+ (bundled with Node)
- A C/C++ build toolchain so `better-sqlite3` can compile native bindings:
  - **Windows**: install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload, or run `npm install --global windows-build-tools` once.
  - **macOS**: install Xcode Command Line Tools (`xcode-select --install`).
  - **Linux**: install `build-essential` (or your distro's equivalent) and Python 3.

## Installing locally

```bash
git clone https://github.com/diagmatrix/blisterpod-manager.git
cd blisterpod-manager
npm install
```

The `npm install` step will compile `better-sqlite3` against your local Electron version. If it fails, double-check the build toolchain requirements above.

## Running

Start the app in development mode (hot reload for the renderer):

```bash
npm run dev
```

The runtime database lives at `<userData>/collection.db` (Electron's per-user data directory), not in the repo. The SQL files under [db/](db/) are the source of truth for schema and views and are applied on first run.

## Other scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Build main, preload, and renderer bundles into `out/`. |
| `npm run preview` | Preview the built app. |
| `npm run package` | Build and create a distributable installer via `electron-builder` (output in `dist/`). |
| `npm run lint` | ESLint over `.ts`/`.tsx` sources. |
| `npm run lint:fix` | ESLint with `--fix`. |
| `npx tsc -b` | Type-check all TS projects (main, preload, renderer). |

## Project layout

- [src/main/](src/main/) — Electron main process (DB, Scryfall refresh, IPC handlers).
- [src/preload/](src/preload/) — Preload bridge exposing `window.api` to the renderer.
- [src/renderer/](src/renderer/) — React UI.
- [src/shared/](src/shared/) — Types shared across processes.
- [db/](db/) — SQL schema (`tables/`) and views (`views/`).
- [resources/](resources/) — App icons and other bundled assets.

See [AGENTS.md](AGENTS.md) for deeper architecture notes and gotchas.

## License

GNU AGPL-3.0-only — see [LICENSE](LICENSE).
