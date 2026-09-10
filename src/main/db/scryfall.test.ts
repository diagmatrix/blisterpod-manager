import type Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { logRecords, resetLogRecords } from '../../../tests/main/electron-log-stub'
import { createTestDb } from '../../../tests/main/sqlite'
import { pruneStaleCards } from './scryfall'

// The prune is pure SQL over the real schema, so it is tested directly against an
// in-memory database rather than through a bulk download.
describe('pruneStaleCards', () => {
    let db: Database.Database

    const seedCard = (id: string, setCode: string, collectorNumber: string): void => {
        db.prepare('INSERT INTO scryfall_cards (id, set_code, collector_number) VALUES (?,?,?)')
            .run(id, setCode, collectorNumber)
    }

    const own = (setCode: string, collectorNumber: string): void => {
        db.prepare('INSERT INTO cards (set_code, collector_number, quantity_nonfoil) VALUES (?,?,1)')
            .run(setCode, collectorNumber)
    }

    /** Stands in for what refreshCards() records while streaming the bulk file. */
    const snapshot = (...ids: string[]): void => {
        db.exec('CREATE TEMP TABLE refresh_scryfall_ids (id TEXT PRIMARY KEY NOT NULL)')
        const stmt = db.prepare('INSERT OR IGNORE INTO refresh_scryfall_ids (id) VALUES (?)')
        for (const id of ids) stmt.run(id)
    }

    const remainingIds = (): string[] =>
        db.prepare('SELECT id FROM scryfall_cards ORDER BY id').all().map((r) => (r as { id: string }).id)

    const warnedAbout = (needle: string): boolean =>
        logRecords.some((r) => r.level === 'warn' && JSON.stringify(r.args).includes(needle))

    beforeEach(async () => {
        db = await createTestDb()
        resetLogRecords()
    })

    it('keeps cards the snapshot still lists and drops the ones it does not', () => {
        seedCard('live', 'MOM', '137')
        seedCard('retired', 'PMOM', '137p')
        // Padded so the snapshot clears the truncated-download ratio guard.
        for (let i = 0; i < 18; i++) seedCard(`filler-${i}`, 'BLB', String(i))
        snapshot('live', ...Array.from({ length: 18 }, (_, i) => `filler-${i}`))

        expect(pruneStaleCards(db)).toEqual({ deleted: 1 })
        expect(remainingIds()).not.toContain('retired')
        expect(remainingIds()).toContain('live')
    })

    it('keeps an absent card that still backs an owned collection entry', () => {
        seedCard('retired-but-owned', 'PMOM', '137p')
        for (let i = 0; i < 19; i++) seedCard(`filler-${i}`, 'BLB', String(i))
        own('PMOM', '137p')
        snapshot(...Array.from({ length: 19 }, (_, i) => `filler-${i}`))

        expect(pruneStaleCards(db)).toEqual({ deleted: 0 })
        expect(remainingIds()).toContain('retired-but-owned')
    })

    it('refuses to prune when the snapshot is too small to be a full download', () => {
        for (let i = 0; i < 20; i++) seedCard(`card-${i}`, 'BLB', String(i))
        snapshot('card-0')

        const { deleted, warning } = pruneStaleCards(db)

        expect(deleted).toBe(0)
        expect(remainingIds()).toHaveLength(20)
        expect(warning).toMatch(/skipping prune/)
        expect(warnedAbout('skipping prune')).toBe(true)
    })

    it('deletes nothing when every stored card is in the snapshot', () => {
        for (let i = 0; i < 20; i++) seedCard(`card-${i}`, 'BLB', String(i))
        snapshot(...Array.from({ length: 20 }, (_, i) => `card-${i}`))

        expect(pruneStaleCards(db)).toEqual({ deleted: 0 })
        expect(remainingIds()).toHaveLength(20)
    })
})
