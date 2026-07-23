import { describe, expect, it } from 'vitest'
import { filterArrayContents, isEmpty, serializeVal } from './utils'

// Tier 1 smoke test. The assertions are trivial on purpose -- the point is that
// importing this module at all proves the electron stub defused the
// `app.getVersion()` call that utils.ts makes at module load.
describe('main/utils', () => {
    it('keeps only values present in the allowed list', () => {
        expect(filterArrayContents(['common', 'bogus', 'rare'], ['common', 'rare'])).toEqual(['common', 'rare'])
    })

    it('serialises values the way the SQLite bindings need them', () => {
        expect(serializeVal(undefined)).toBeNull()
        expect(serializeVal(true)).toBe(1)
        expect(serializeVal(false)).toBe(0)
        expect(serializeVal(['W', 'U'])).toBe('["W","U"]')
        expect(serializeVal('Boros Reckoner')).toBe('Boros Reckoner')
    })

    it('detects empty records', () => {
        expect(isEmpty({})).toBe(true)
        expect(isEmpty({ a: undefined })).toBe(false)
    })
})
