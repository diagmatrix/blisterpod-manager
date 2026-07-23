/**
 * Builds a real in-memory SQLite database from the repo's own schema files.
 *
 * Mirrors `executeSQLFilesFromDir` in `src/main/db/index.ts`: tables first, then
 * views. Reuses the app's own `walkDir` so the traversal order cannot drift from
 * what the app actually does at startup.
 *
 * better-sqlite3 is deliberately NOT mocked -- running the real schema is what
 * makes this tier worth having. It exercises the
 * `cards.(set_code, collector_number)` <-> `scryfall_cards` join, the views, and
 * the SQL-level quantity invariants.
 *
 * NOTE: better-sqlite3 is a native module. Vitest runs under plain Node, so if it
 * was last built for Electron (`npm run package:post`) it will fail to load here.
 * `npm rebuild better-sqlite3` restores the Node build.
 */
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { walkDir } from '../../src/main/utils'

const REPO_ROOT = resolve(import.meta.dirname, '../..')
const DB_DIR = join(REPO_ROOT, 'db')
const FIXTURES_DIR = join(REPO_ROOT, 'tests', 'fixtures')

async function execSqlDir(db: Database.Database, dirPath: string): Promise<void> {
    for await (const filePath of walkDir(dirPath)) {
        if (filePath.endsWith('.sql')) {
            db.exec(readFileSync(filePath, 'utf-8'))
        }
    }
}

/** Fresh in-memory database with `db/tables` and `db/views` applied. */
export async function createTestDb(): Promise<Database.Database> {
    const db = new Database(':memory:')
    await execSqlDir(db, join(DB_DIR, 'tables'))
    await execSqlDir(db, join(DB_DIR, 'views'))
    return db
}

/** Apply a `.sql` fixture from `tests/fixtures/`. */
export function seedDb(db: Database.Database, fixtureFile: string): void {
    db.exec(readFileSync(join(FIXTURES_DIR, fixtureFile), 'utf-8'))
}

/** Read a non-SQL fixture (CSV samples, etc.) as text. */
export function readFixture(fixtureFile: string): string {
    return readFileSync(join(FIXTURES_DIR, fixtureFile), 'utf-8')
}
