/**
 * Launches the built app against a throwaway profile.
 *
 * Isolation comes from Electron's `--user-data-dir` switch, which moves
 * `app.getPath('userData')` -- and with it both the database (see DB_PATH in
 * src/main/db/index.ts) and the electron-store settings file -- into a temp dir.
 * No product code is aware this is a test.
 *
 * Seeding uses Node's built-in `node:sqlite` rather than better-sqlite3 on
 * purpose: for E2E the native module must be built for Electron's ABI
 * (`npm run package:post`), which makes it unloadable from this plain-Node
 * process. `node:sqlite` sidesteps the conflict entirely.
 *
 * A pre-seeded database also keeps the app off the network -- it never enters
 * the Scryfall bulk-download path in src/main/scryfallRefresh.ts.
 */
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const REPO_ROOT = resolve(import.meta.dirname, '..', '..')

/**
 * Launch the project directory, not `out/main/index.js` directly.
 *
 * `src/main/db/index.ts` derives SQL_DIR from `app.getAppPath()`, which points at
 * the script's own directory when Electron is handed a file path -- so the schema
 * in `db/` would not be found. Pointing at the root resolves `main` from
 * package.json and matches how `npm run dev` and the packaged app actually start.
 */
const APP_ENTRY = REPO_ROOT

export interface LaunchedApp {
    app: ElectronApplication
    page: Page
    userDataDir: string
    close: () => Promise<void>
}

function execSqlDir(db: DatabaseSync, dirPath: string): void {
    for (const name of readdirSync(dirPath).filter((f) => f.endsWith('.sql'))) {
        db.exec(readFileSync(join(dirPath, name), 'utf-8'))
    }
}

function seedUserData(userDataDir: string): void {
    const db = new DatabaseSync(join(userDataDir, 'collection.db'))
    execSqlDir(db, join(REPO_ROOT, 'db', 'tables'))
    execSqlDir(db, join(REPO_ROOT, 'db', 'views'))
    // Same fixture the Vitest integration tests use.
    db.exec(readFileSync(join(REPO_ROOT, 'tests', 'fixtures', 'collection.sql'), 'utf-8'))
    db.close()

    // electron-store's default file. `firstRun: false` suppresses FirstRunDialog,
    // which would otherwise cover the UI on a fresh profile.
    writeFileSync(join(userDataDir, 'config.json'), JSON.stringify({
        windowBounds: { width: 1280, height: 800, isMaximized: false },
        theme: 'light',
        defaultPageSize: 30,
        firstRun: false,
    }))
}

/**
 * `ELECTRON_RUN_AS_NODE` makes electron.exe behave as a bare Node binary, which
 * fails with a confusing `bad option: --remote-debugging-port` rather than
 * anything that points at the cause. Some tool shells export it, so strip it.
 */
function electronEnv(): Record<string, string> {
    const env = { ...process.env } as Record<string, string>
    delete env.ELECTRON_RUN_AS_NODE
    return env
}

export async function launchApp(): Promise<LaunchedApp> {
    const userDataDir = mkdtempSync(join(tmpdir(), 'blisterpod-e2e-'))
    seedUserData(userDataDir)

    const app = await electron.launch({
        args: [APP_ENTRY, `--user-data-dir=${userDataDir}`],
        cwd: REPO_ROOT,
        env: electronEnv(),
    })
    const page = await app.firstWindow()

    return {
        app,
        page,
        userDataDir,
        close: async () => {
            await app.close()
            rmSync(userDataDir, { recursive: true, force: true })
        },
    }
}
