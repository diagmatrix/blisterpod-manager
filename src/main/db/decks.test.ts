import type Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DeckFolder } from '../../models/decks'
import { BASE_DECK_FOLDER } from '../../models/decks'
import type { MutationResult, PaginatedResult } from '../../models/responses'
import { loggedErrors } from '../../../tests/main/electron-log-stub'
import { DECKS_CREATE_NAME, DECKS_LIST_NAME, registerDbHandlers, type IpcHarness } from '../../../tests/main/ipc-harness'
import { createTestDb } from '../../../tests/main/sqlite'

describe('decks handlers', () => {
    let db: Database.Database
    let ipc: IpcHarness

    const seedDeck = (name: string, folder: string | null, format: string | null = null, inUse = 0): void => {
        db.prepare('INSERT INTO decks (name, format, folder, in_use) VALUES (?,?,?,?)').run(name, format, folder, inUse)
    }

    const list = (): Promise<PaginatedResult<DeckFolder>> =>
        ipc.invoke<PaginatedResult<DeckFolder>>(DECKS_LIST_NAME)

    const folderNames = (result: PaginatedResult<DeckFolder>): string[] => result.rows.map((f) => f.name)

    const decksIn = (result: PaginatedResult<DeckFolder>, folder: string): string[] =>
        result.rows.find((f) => f.name === folder)?.decks.map((d) => d.name) ?? []

    beforeEach(async () => {
        db = await createTestDb()
        ipc = registerDbHandlers(db)
    })

    afterEach(() => {
        db.close()
    })

    describe('listing decks', () => {
        it('groups decks into folders and counts decks, not folders', async () => {
            seedDeck('Atraxa Superfriends', 'Brews')
            seedDeck('Dimir Mill', 'Brews')
            seedDeck('Legacy Storm', 'Archive')

            const result = await list()

            expect(loggedErrors()).toEqual([])
            expect(folderNames(result)).toEqual(['Archive', 'Brews'])
            expect(result.total).toBe(3)
        })

        it('collects decks with no folder under the base folder, listed first', async () => {
            seedDeck('Draft Leftovers', null)
            seedDeck('Archive Deck', 'Archive')

            const result = await list()

            expect(folderNames(result)).toEqual([BASE_DECK_FOLDER, 'Archive'])
            expect(decksIn(result, BASE_DECK_FOLDER)).toEqual(['Draft Leftovers'])
        })

        it('sorts folders alphabetically after the base folder', async () => {
            seedDeck('Zeta', 'Zoo')
            seedDeck('Alpha', 'Archive')
            seedDeck('Mid', 'Brews')
            seedDeck('Loose', null)

            expect(folderNames(await list())).toEqual([BASE_DECK_FOLDER, 'Archive', 'Brews', 'Zoo'])
        })

        it('sorts decks by name within each folder', async () => {
            seedDeck('Zeta deck', 'Brews')
            seedDeck('Alpha deck', 'Brews')
            seedDeck('Mid deck', 'Brews')
            seedDeck('Zeta loose', null)
            seedDeck('Alpha loose', null)

            const result = await list()

            expect(decksIn(result, 'Brews')).toEqual(['Alpha deck', 'Mid deck', 'Zeta deck'])
            expect(decksIn(result, BASE_DECK_FOLDER)).toEqual(['Alpha loose', 'Zeta loose'])
        })

        it('returns every column the renderer reads', async () => {
            seedDeck('Mono Red Aggro', 'In paper', 'Modern', 1)

            const [deck] = (await list()).rows[0].decks

            expect(deck).toMatchObject({
                name: 'Mono Red Aggro',
                format: 'Modern',
                folder: 'In paper',
            })
            expect(deck.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
            expect(deck.updated_at).toBeNull()
        })

        it('normalises SQLite\'s integer in_use into a real boolean', async () => {
            // SQLite stores BOOLEAN as 1/0. The handler converts it because
            // `filterDeckFolders` compares `deck.in_use !== inUse` strictly, so a
            // raw 1 would make the renderer's "In use" filter match nothing.
            seedDeck('In use', 'Brews', null, 1)
            seedDeck('Idle', 'Brews', null, 0)

            const [idle, inUse] = (await list()).rows[0].decks

            expect(inUse.in_use).toBe(true)
            expect(idle.in_use).toBe(false)
        })

        it('returns an empty result for an empty table', async () => {
            const result = await list()

            expect(result).toEqual({ rows: [], total: 0 })
            expect(loggedErrors()).toEqual([])
        })

        it('logs and returns an empty result instead of throwing when the query fails', async () => {
            db.exec('DROP TABLE decks')

            const result = await list()

            expect(result).toEqual({ rows: [], total: 0 })
            expect(loggedErrors()).toHaveLength(1)
        })
    })

    describe('creating a deck', () => {
        const create = (params: unknown): Promise<MutationResult> =>
            ipc.invoke<MutationResult>(DECKS_CREATE_NAME, params)

        const rowFor = (name: string): Record<string, unknown> | undefined =>
            db.prepare('SELECT * FROM decks WHERE name = ?').get(name) as Record<string, unknown> | undefined

        const deckCount = (): number =>
            (db.prepare('SELECT COUNT(*) AS n FROM decks').get() as { n: number }).n

        it('inserts a deck with all fields set', async () => {
            const result = await create({ name: 'Atraxa', format: 'Commander', folder: 'Brews', in_use: true })

            expect(result).toEqual({ success: true })
            expect(rowFor('Atraxa')).toMatchObject({
                name: 'Atraxa',
                format: 'Commander',
                folder: 'Brews',
                in_use: 1,
            })
            expect(loggedErrors()).toEqual([])
        })

        it('stores optional fields as NULL when omitted', async () => {
            await create({ name: 'Bare' })

            expect(rowFor('Bare')).toMatchObject({ format: null, folder: null })
        })

        it('defaults in_use to false, overriding the column default of TRUE', async () => {
            await create({ name: 'Bare' })

            expect(rowFor('Bare')).toMatchObject({ in_use: 0 })
        })

        it('sets updated_at at creation time, not just created_at', async () => {
            await create({ name: 'Fresh' })

            const row = rowFor('Fresh')
            expect(row?.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
            expect(row?.updated_at).toBe(row?.created_at)
        })

        it('makes the new deck visible to the list handler', async () => {
            await create({ name: 'Atraxa', format: 'Commander', folder: 'Brews' })
            await create({ name: 'Draft Leftovers' })

            const result = await list()

            expect(result.total).toBe(2)
            expect(folderNames(result)).toEqual([BASE_DECK_FOLDER, 'Brews'])
            expect(decksIn(result, 'Brews')).toEqual(['Atraxa'])
        })

        describe('validation', () => {
            it.each([
                ['a missing name', {}],
                ['an empty name', { name: '' }],
                ['a whitespace-only name', { name: '   ' }],
            ])('rejects %s', async (_label, params) => {
                const result = await create(params)

                expect(result).toEqual({ success: false, error: 'Error creating deck: name is required' })
                expect(deckCount()).toBe(0)
                expect(loggedErrors()).toHaveLength(1)
            })

            it('rejects a non-boolean in_use', async () => {
                const result = await create({ name: 'Numeric', in_use: 1 })

                expect(result).toEqual({ success: false, error: 'Error creating deck: in_use must be a boolean' })
                expect(deckCount()).toBe(0)
            })

            it('accepts an omitted in_use, which is not the same as a bad one', async () => {
                expect(await create({ name: 'Omitted' })).toEqual({ success: true })
            })

            it('reports the name problem first when both fields are bad', async () => {
                const result = await create({ name: '', in_use: 'yes' })

                expect(result.error).toBe('Error creating deck: name is required')
            })
        })

        describe('when the insert fails', () => {
            it('reports a generic error for a duplicate name', async () => {
                await create({ name: 'Atraxa' })

                const result = await create({ name: 'Atraxa' })

                expect(result).toEqual({ success: false, error: 'Error creating deck' })
                expect(deckCount()).toBe(1)
                expect(loggedErrors()).toHaveLength(1)
            })

            it('does not leak the SQLite message to the renderer', async () => {
                db.exec('DROP TABLE decks')

                const result = await create({ name: 'Nowhere' })

                expect(result.error).toBe('Error creating deck')
                expect(result.error).not.toContain('no such table')
                expect(loggedErrors()).toHaveLength(1)
            })
        })
    })

    // TODO: Add update + delete decks + listings
})
