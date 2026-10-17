import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { runMigrations } from './migrations'
import { getTableColumns } from '../utils'

// db/migrations/ is the only description of the schema: replaying it from empty
// builds a fresh database, replaying it from a user's PRAGMA user_version brings
// theirs up to date. Both paths run the same files, so they agree by
// construction -- with one hole worth guarding.
//
// A migration that has already shipped is inert for everyone who ran it. Editing
// 003_scryfall_cards.sql to add a column therefore reaches new installs only,
// silently, while existing users keep the old table. The snapshot tests below
// catch that: they build a database the way a past release did, upgrade it, and
// require the result to match a fresh install.
//
// A snapshot only guards the tables it contains, so add one per release
// (tests/fixtures/schema/<version>.sql) and never edit an existing one.

const REPO_ROOT = resolve(import.meta.dirname, '../../..')
const MIGRATIONS_DIR = join(REPO_ROOT, 'db', 'migrations')
const SNAPSHOT_DIR = join(REPO_ROOT, 'tests', 'fixtures', 'schema')

const SNAPSHOTS = readdirSync(SNAPSHOT_DIR)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => ({ version: basename(name, '.sql'), path: join(SNAPSHOT_DIR, name) }))

const MIGRATION_VERSIONS = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => Number(name.split('_')[0]))

/** What someone installing this version for the first time gets. */
async function freshDb(): Promise<Database.Database> {
    const db = new Database(':memory:')
    await runMigrations(db)
    return db
}

/** What someone upgrading from a released version gets: their file, then the pending migrations. */
async function upgradedDb(snapshotPath: string): Promise<Database.Database> {
    const db = new Database(':memory:')
    db.exec(readFileSync(snapshotPath, 'utf-8'))
    await runMigrations(db)
    return db
}

function schemaVersion(db: Database.Database): number {
    return db.pragma('user_version', { simple: true }) as number
}

function tableNames(db: Database.Database): string[] {
    const rows = db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all() as { name: string }[]
    return rows.map((row) => row.name)
}

describe('migrations', () => {
    let latest: number

    beforeAll(async () => {
        const db = await freshDb()
        latest = schemaVersion(db)
        db.close()
    })

    it('numbers every migration uniquely and above zero', () => {
        expect(MIGRATION_VERSIONS.length).toBeGreaterThan(0)
        expect(MIGRATION_VERSIONS.every(Number.isInteger)).toBe(true)
        expect(MIGRATION_VERSIONS.every((version) => version > 0)).toBe(true)
        expect(new Set(MIGRATION_VERSIONS).size).toBe(MIGRATION_VERSIONS.length)
    })

    it('builds the schema from empty and stamps the newest version', async () => {
        const db = await freshDb()

        expect(latest).toBe(Math.max(...MIGRATION_VERSIONS))
        expect(tableNames(db)).toContain('scryfall_cards')
        expect(getTableColumns(db, 'scryfall_cards')).toContain('card_types')
        db.close()
    })

    it('does not re-apply migrations on the next launch', async () => {
        const db = await freshDb()

        expect(await runMigrations(db)).toEqual([])
        expect(schemaVersion(db)).toBe(latest)
        db.close()
    })

    it('adds card_types to a database that predates it', async () => {
        const db = new Database(':memory:')
        db.exec(readFileSync(join(SNAPSHOT_DIR, '1.0.5.sql'), 'utf-8'))

        expect(getTableColumns(db, 'scryfall_cards')).not.toContain('card_types')
        await runMigrations(db)
        expect(getTableColumns(db, 'scryfall_cards')).toContain('card_types')
        db.close()
    })

    describe.each(SNAPSHOTS)('upgrading from $version', ({ path }) => {
        it('reaches the newest schema version', async () => {
            const db = await upgradedDb(path)

            expect(schemaVersion(db)).toBe(latest)
            db.close()
        })

        it('produces the same schema as a fresh install', async () => {
            const fresh = await freshDb()
            const upgraded = await upgradedDb(path)

            expect(tableNames(upgraded)).toEqual(tableNames(fresh))
            for (const table of tableNames(fresh)) {
                expect(getTableColumns(upgraded, table).sort())
                    .toEqual(getTableColumns(fresh, table).sort())
            }

            fresh.close()
            upgraded.close()
        })

        it('does not re-apply migrations on the next launch', async () => {
            const db = await upgradedDb(path)

            expect(await runMigrations(db)).toEqual([])
            expect(schemaVersion(db)).toBe(latest)
            db.close()
        })
    })
})
