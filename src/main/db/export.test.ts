import type Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ExportResult } from '../../models/responses'
import { loggedErrors } from '../../../tests/main/electron-log-stub'
import {
    COLLECTION_EXPORT_NAME, COLLECTION_EXPORT_MOXFIELD_NAME, COLLECTION_EXPORT_MANABOX_NAME,
    registerDbHandlers, type IpcHarness,
} from '../../../tests/main/ipc-harness'
import { createTestDb, seedDb } from '../../../tests/main/sqlite'

// Exercises the three export handlers end to end: real schema from db/tables +
// db/views, the real db/queries/export_*.sql, and a real file on disk. Only the
// failure injection is synthetic (dropping a table, or aiming at a directory
// that does not exist), because both failure modes are ones the handlers
// explicitly catch and turn into `{ exported: 0, error }`.
describe('collection export handlers', () => {
    let db: Database.Database
    let ipc: IpcHarness
    let outDir: string

    /** Header + data lines of a file one of the handlers just wrote. */
    const readCsv = (path: string): string[] => readFileSync(path, 'utf8').split('\n')

    const target = (name: string): string => join(outDir, name)

    beforeEach(async () => {
        db = await createTestDb()
        seedDb(db, 'collection.sql')
        ipc = registerDbHandlers(db)
        outDir = mkdtempSync(join(tmpdir(), 'blisterpod-export-'))
    })

    afterEach(() => {
        db.close()
        rmSync(outDir, { recursive: true, force: true })
    })

    describe('blisterpod format', () => {
        it('writes every collection row, ordered by set and collector number', async () => {
            const file = target('blisterpod.csv')

            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, file)

            expect(loggedErrors()).toEqual([])
            expect(result).toEqual({ exported: 3 })

            const [header, ...rows] = readCsv(file)
            expect(header).toBe('set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at')
            expect(rows.map((r) => r.split(',').slice(0, 4).join(','))).toEqual([
                'BFZ,163,1,0',
                'BFZ,184,4,0',
                'GTC,54,2,1',
            ])
        })

        it('renders a null updated_at as an empty field, keeping the column count', async () => {
            // created_at defaults to CURRENT_TIMESTAMP and updated_at stays NULL
            // until a card is edited, so a fresh row exports a trailing empty field.
            const file = target('nulls.csv')

            await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, file)

            const [, firstRow] = readCsv(file)
            const fields = firstRow.split(',')

            expect(fields).toHaveLength(6)
            expect(fields[4]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
            expect(fields[5]).toBe('')
        })

        it('writes a header-only file for an empty collection', async () => {
            db.prepare('DELETE FROM cards').run()

            const file = target('empty.csv')
            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, file)

            expect(result).toEqual({ exported: 0 })
            expect(readFileSync(file, 'utf8')).toBe(
                'set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at',
            )
        })

        it('includes cards with no Scryfall match, unlike the other two formats', async () => {
            // Nothing in scryfall_cards matches GTC/999, so mapped_collection
            // leaves scryfall_id NULL and the other exports filter it out.
            db.prepare('INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES (?,?,?,?)')
                .run('GTC', '999', 1, 0)

            const blisterpod = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, target('bp.csv'))
            const moxfield = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MOXFIELD_NAME, target('mox.csv'))

            expect(blisterpod.exported).toBe(4)
            expect(moxfield.exported).toBe(4) // unchanged: 3 seeded cards -> 4 foil/nonfoil lines
            expect(readCsv(target('bp.csv')).join('\n')).toContain('GTC,999,1,0')
            expect(readCsv(target('mox.csv')).join('\n')).not.toContain('999')
        })
    })

    describe('moxfield format', () => {
        it('splits a card with both finishes into a foil and a nonfoil line', async () => {
            const file = target('moxfield.csv')

            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MOXFIELD_NAME, file)

            expect(loggedErrors()).toEqual([])
            // GTC/54 is held in both finishes, so 3 collection rows become 4 lines
            // and `exported` counts lines rather than rows.
            expect(result).toEqual({ exported: 4 })
            expect(readCsv(file)).toEqual([
                'Name,Count,Edition,Collector Number,Foil',
                '"Gideon, Ally of Zendikar",1,BFZ,163,false',
                '"Wastes",4,BFZ,184,false',
                '"Boros Reckoner",2,GTC,54,false',
                '"Boros Reckoner",1,GTC,54,true',
            ])
        })

        it('omits the finish a card is not held in', async () => {
            db.prepare('UPDATE cards SET quantity_nonfoil = 0, quantity_foil = 3 WHERE set_code = ? AND collector_number = ?')
                .run('BFZ', '163')

            await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MOXFIELD_NAME, target('finish.csv'))
            const lines = readCsv(target('finish.csv')).filter((l) => l.includes('BFZ,163'))

            expect(lines).toEqual(['"Gideon, Ally of Zendikar",3,BFZ,163,true'])
        })
    })

    describe('manabox format', () => {
        it('writes one line per finish with the Scryfall id and added date', async () => {
            const file = target('manabox.csv')

            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MANABOX_NAME, file)

            expect(loggedErrors()).toEqual([])
            expect(result).toEqual({ exported: 4 })

            const [header, ...rows] = readCsv(file)
            expect(header).toBe('Name,Set code,Collector number,Foil,Quantity,Scryfall ID,Added')
            // Ordered by set code then collector number, and each card emits its
            // nonfoil line before its foil one, each carrying that finish's own
            // quantity. The trailing added date is dropped here because it is
            // CURRENT_TIMESTAMP; it gets its own test below.
            expect(rows.map((r) => r.slice(0, r.lastIndexOf(',')))).toEqual([
                '"Gideon, Ally of Zendikar",BFZ,163,normal,1,aaaaaaaa-0000-0000-0000-000000000002',
                '"Wastes",BFZ,184,normal,4,aaaaaaaa-0000-0000-0000-000000000003',
                '"Boros Reckoner",GTC,54,normal,2,aaaaaaaa-0000-0000-0000-000000000001',
                '"Boros Reckoner",GTC,54,foil,1,aaaaaaaa-0000-0000-0000-000000000001',
            ])
            expect(rows.every((r) => /,\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r))).toBe(true)
        })

        it('prefers updated_at over created_at for the added date', async () => {
            db.prepare('UPDATE cards SET updated_at = ? WHERE set_code = ? AND collector_number = ?')
                .run('2024-03-04 05:06:07', 'BFZ', '184')

            await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MANABOX_NAME, target('added.csv'))
            const line = readCsv(target('added.csv')).find((l) => l.includes('BFZ,184'))

            expect(line).toBe('"Wastes",BFZ,184,normal,4,aaaaaaaa-0000-0000-0000-000000000003,2024-03-04 05:06:07')
        })
    })

    describe('when the query fails', () => {
        it('returns an error instead of throwing when the cards table is gone', async () => {
            db.exec('DROP TABLE cards')

            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, target('gone.csv'))

            expect(result.exported).toBe(0)
            expect(result.error).toMatch(/Error exporting collection:.*no such table: cards/)
            expect(loggedErrors()).toHaveLength(1)
        })

        it('does not create a file when the query fails', async () => {
            db.exec('DROP TABLE cards')

            await ipc.invoke<ExportResult>(COLLECTION_EXPORT_NAME, target('never-written.csv'))

            expect(existsSync(target('never-written.csv'))).toBe(false)
        })

        it.each([
            ['Moxfield', COLLECTION_EXPORT_MOXFIELD_NAME],
            ['Manabox', COLLECTION_EXPORT_MANABOX_NAME],
        ])('names the format in the %s error when mapped_collection is gone', async (format, channel) => {
            db.exec('DROP VIEW mapped_collection')

            const result = await ipc.invoke<ExportResult>(channel, target('gone.csv'))

            expect(result.exported).toBe(0)
            expect(result.error).toMatch(
                new RegExp(`Error exporting collection to ${format}:.*no such table: mapped_collection`),
            )
            expect(loggedErrors()).toHaveLength(1)
        })
    })

    describe('when the file cannot be written', () => {
        // A path under a directory that does not exist is the realistic version of
        // this: the renderer hands over whatever the save dialog (or the free-text
        // path input in CollectionExport.tsx) produced.
        const missingDir = (name: string): string => join(outDir, 'no', 'such', 'dir', name)

        it.each([
            ['blisterpod', COLLECTION_EXPORT_NAME, 'Error exporting collection'],
            ['moxfield', COLLECTION_EXPORT_MOXFIELD_NAME, 'Error exporting collection to Moxfield'],
            ['manabox', COLLECTION_EXPORT_MANABOX_NAME, 'Error exporting collection to Manabox'],
        ])('reports the write failure for %s', async (format, channel, prefix) => {
            const result = await ipc.invoke<ExportResult>(channel, missingDir(`${format}.csv`))

            expect(result.exported).toBe(0)
            expect(result.error).toContain(prefix)
            expect(result.error).toContain('ENOENT')
            expect(loggedErrors()).toHaveLength(1)
        })

        it('reports the failure rather than the row count it would have written', async () => {
            const result = await ipc.invoke<ExportResult>(COLLECTION_EXPORT_MOXFIELD_NAME, missingDir('mox.csv'))

            // The rows were read successfully; only the write failed. `exported`
            // must not leak the count the handler was about to report.
            expect(result).toEqual({ exported: 0, error: expect.stringContaining('ENOENT') })
        })
    })

    describe('CSV quoting', () => {
        // `"Ach! Hans, Run!"` is a real card whose name contains both a comma and
        // literal double quotes, which is the case that breaks a naive `"${name}"`.
        beforeEach(() => {
            db.prepare('INSERT INTO scryfall_cards (id, name, set_code, collector_number) VALUES (?,?,?,?)')
                .run('aaaaaaaa-0000-0000-0000-000000000004', '"Ach! Hans, Run!"', 'GTC', '55')
            db.prepare('INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil) VALUES (?,?,?,?)')
                .run('GTC', '55', 1, 0)
        })

        it.each([
            ['moxfield', COLLECTION_EXPORT_MOXFIELD_NAME, '"""Ach! Hans, Run!""",1,GTC,55,false'],
            ['manabox', COLLECTION_EXPORT_MANABOX_NAME, '"""Ach! Hans, Run!""",GTC,55,normal,1,aaaaaaaa-0000-0000-0000-000000000004'],
        ])('doubles quotes inside a card name for %s', async (format, channel, expected) => {
            await ipc.invoke<ExportResult>(channel, target(`${format}-quotes.csv`))
            const line = readCsv(target(`${format}-quotes.csv`)).find((l) => l.includes('GTC,55'))

            expect(line?.startsWith(expected)).toBe(true)
        })
    })
})
