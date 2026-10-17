import { describe, expect, it } from 'vitest'
import { buildCardRow, buildSetRow, getTypeLine, parseCardTypes } from './scryfallRefresh'

// These are the pure Scryfall-JSON -> DB-row mappers. They live in this module rather
// than db/scryfall.ts precisely so they can be exercised without a database or the
// network. (The electron stub is still doing its usual work here, because ./logger and
// ./utils both touch `app` at module load.)
describe('main/scryfallRefresh mappers', () => {
    describe('parseCardTypes', () => {
        it('splits a single-face type line into types and subtypes', () => {
            expect(parseCardTypes('Basic Land — Forest')).toEqual(['Basic', 'Land'])
            expect(parseCardTypes('Basic Land — Forest', true)).toEqual(['Forest'])
        })

        it('merges both faces of a double-faced card and de-duplicates', () => {
            const typeLine = 'Legendary Creature — Elder Dinosaur // Legendary Creature — Phyrexian Elder Dinosaur'

            expect(parseCardTypes(typeLine)).toEqual(['Legendary', 'Creature'])
            expect(parseCardTypes(typeLine, true)).toEqual(['Elder', 'Dinosaur', 'Phyrexian'])
        })

        it('returns null, not an empty list, when the type line has no subtype section', () => {
            expect(parseCardTypes('Sorcery')).toEqual(['Sorcery'])
            expect(parseCardTypes('Sorcery', true)).toBeNull()
        })
    })

    describe('getTypeLine', () => {
        // Scryfall's `reversible_card` layout (Secret Lair double-sided reprints) ships no
        // top-level type_line at all -- it exists only inside card_faces.
        const reversible = {
            layout: 'reversible_card',
            card_faces: [
                { type_line: 'Legendary Creature — Elf Druid' },
                { type_line: 'Legendary Creature — Elf Druid' },
            ],
        }

        it('prefers the top-level type line when there is one', () => {
            expect(getTypeLine({ type_line: 'Basic Land — Forest', card_faces: [] })).toBe('Basic Land — Forest')
        })

        it('falls back to joining the faces when the top-level type line is missing', () => {
            expect(getTypeLine(reversible)).toBe('Legendary Creature — Elf Druid // Legendary Creature — Elf Druid')
        })

        it('feeds the parser so a reversible card still resolves its types', () => {
            expect(parseCardTypes(getTypeLine(reversible))).toEqual(['Legendary', 'Creature'])
            expect(parseCardTypes(getTypeLine(reversible), true)).toEqual(['Elf', 'Druid'])
        })

        it('returns an empty string when there is nothing to read', () => {
            expect(getTypeLine({ id: 'abc' })).toBe('')
            expect(getTypeLine({ card_faces: [null, { name: 'no type line here' }] })).toBe('')
        })
    })

    describe('buildCardRow', () => {
        const columns = ['id', 'set_code', 'collector_number', 'collector_number_normalised', 'type_line', 'card_types', 'card_subtypes', 'colors']

        it('renames set to set_code and uppercases it', () => {
            const row = buildCardRow({ id: 'abc', set: 'mom' }, columns)

            expect(row.set_code).toBe('MOM')
        })

        it('strips non-digits to derive collector_number_normalised', () => {
            expect(buildCardRow({ collector_number: '137p' }, columns).collector_number_normalised).toBe(137)
            expect(buildCardRow({ collector_number: '2026-1' }, columns).collector_number_normalised).toBe(20261)
            expect(buildCardRow({ collector_number: 'ABC' }, columns).collector_number_normalised).toBeNull()
        })

        it('stores parsed type lists as JSON text', () => {
            const row = buildCardRow({ id: 'abc', type_line: 'Basic Land — Forest' }, columns)

            expect(row.card_types).toBe('["Basic","Land"]')
            expect(row.card_subtypes).toBe('["Forest"]')
        })

        it('nulls a missing type line rather than writing an empty list', () => {
            const row = buildCardRow({ id: 'abc' }, columns)

            expect(row.type_line).toBeNull()
            expect(row.card_types).toBeNull()
            expect(row.card_subtypes).toBeNull()
        })

        it('fills type_line and both type lists for a reversible card', () => {
            const row = buildCardRow({
                id: 'abc',
                layout: 'reversible_card',
                card_faces: [
                    { type_line: 'Artifact — Vehicle' },
                    { type_line: 'Artifact — Vehicle' },
                ],
            }, columns)

            expect(row.type_line).toBe('Artifact — Vehicle // Artifact — Vehicle')
            expect(row.card_types).toBe('["Artifact"]')
            expect(row.card_subtypes).toBe('["Vehicle"]')
        })

        it('emits a value for every requested column so the INSERT stays positional', () => {
            const row = buildCardRow({ id: 'abc' }, columns)

            expect(Object.keys(row)).toEqual(columns)
        })
    })

    describe('buildSetRow', () => {
        const columns = ['id', 'code', 'parent_set_code', 'name']

        it('uppercases both set codes', () => {
            const row = buildSetRow({ id: 'abc', code: 'pmom', parent_set_code: 'mom', name: 'March of the Machine Promos' }, columns)

            expect(row.code).toBe('PMOM')
            expect(row.parent_set_code).toBe('MOM')
            expect(row.name).toBe('March of the Machine Promos')
        })

        it('returns an empty record when the payload has no id', () => {
            expect(buildSetRow({ code: 'pmom' }, columns)).toEqual({})
        })
    })
})
