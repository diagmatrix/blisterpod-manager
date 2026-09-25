import type Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loggedErrors } from '../../../tests/main/electron-log-stub'
import {
    CARDS_SEARCH_NAME, COLLECTION_LIST_NAME, STATS_SUMMARY_NAME,
    registerDbHandlers, type IpcHarness,
} from '../../../tests/main/ipc-harness'
import { createTestDb, seedDb } from '../../../tests/main/sqlite'

// Tier 2 smoke test: proves the whole integration path is wired --
// real schema from db/model + db/views, real queries from db/queries, and the
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

    // The card type filter reaches into the JSON the views expose, so it is only
    // really proven against the real schema.
    describe('filtering the catalogue by card type', () => {
        async function searchTypes(cardTypes: string[]): Promise<string[]> {
            const result = await ipc.invoke<{ rows: { name: string }[] }>(
                CARDS_SEARCH_NAME,
                { cardTypes, layoutFilter: 'all' },
            )
            expect(loggedErrors()).toEqual([])
            return result.rows.map((row) => row.name)
        }

        it('matches a type', async () => {
            expect(await searchTypes(['creature'])).toEqual(['Boros Reckoner'])
        })

        it('matches a subtype through the same box', async () => {
            expect(await searchTypes(['minotaur'])).toEqual(['Boros Reckoner'])
        })

        it('matches a card whose subtypes are NULL', async () => {
            expect(await searchTypes(['land'])).toEqual(['Wastes'])
        })

        it('ANDs several types together', async () => {
            expect(await searchTypes(['legendary', 'planeswalker'])).toEqual(['Gideon, Ally of Zendikar'])
            expect(await searchTypes(['creature', 'planeswalker'])).toEqual([])
        })

        it('matches a whole type, not a fragment of one', async () => {
            expect(await searchTypes(['wall'])).toEqual(['Boros Reckoner'])
            expect(await searchTypes(['creat'])).toEqual([])
            expect(await searchTypes(['ino'])).toEqual([])
        })

        it('filters the collection by type as well', async () => {
            const result = await ipc.invoke<{ rows: { name: string }[] }>(
                COLLECTION_LIST_NAME,
                { cardTypes: ['basic'], layoutFilter: 'all' },
            )

            expect(loggedErrors()).toEqual([])
            expect(result.rows.map((row) => row.name)).toEqual(['Wastes'])
        })
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
