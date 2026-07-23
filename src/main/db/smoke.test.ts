import type Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loggedErrors } from '../../../tests/main/electron-log-stub'
import {
    CARDS_SEARCH_NAME, COLLECTION_LIST_NAME, STATS_SUMMARY_NAME,
    registerDbHandlers, type IpcHarness,
} from '../../../tests/main/ipc-harness'
import { createTestDb, seedDb } from '../../../tests/main/sqlite'

// Tier 2 smoke test: proves the whole integration path is wired --
// real schema from db/tables + db/views, real queries from db/queries, and the
// ipcMain.handle closures reachable through the harness.
describe('db integration harness', () => {
    let db: Database.Database
    let ipc: IpcHarness

    beforeEach(async () => {
        db = await createTestDb()
        seedDb(db, 'collection.sql')
        ipc = registerDbHandlers(db)
    })

    afterEach(() => {
        db.close()
    })

    it('applies the real schema, including the quantity invariants', () => {
        // A row with no copies at all must be rejected by the SQL CHECK constraint.
        expect(() =>
            db.prepare('INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES (?,?,?,?)')
                .run('GTC', '99', 0, 0),
        ).toThrow(/quantity_more_than_zero/)
    })

    it('registers every DB channel', () => {
        expect(ipc.channels()).toEqual(expect.arrayContaining([
            COLLECTION_LIST_NAME, CARDS_SEARCH_NAME, STATS_SUMMARY_NAME,
        ]))
    })

    it('searches the scryfall catalogue through the recorded handler', async () => {
        const result = await ipc.invoke<{ rows: { name: string }[], total: number }>(
            CARDS_SEARCH_NAME,
            { cardName: 'Boros', layoutFilter: 'all' },
        )

        expect(loggedErrors()).toEqual([])
        expect(result.total).toBe(1)
        expect(result.rows[0].name).toBe('Boros Reckoner')
    })

    it('lists the seeded collection joined against the scryfall catalogue', async () => {
        const result = await ipc.invoke<{ rows: unknown[], total: number }>(
            COLLECTION_LIST_NAME,
            { layoutFilter: 'all' },
        )

        expect(loggedErrors()).toEqual([])
        expect(result.rows).toHaveLength(3)
    })
})
