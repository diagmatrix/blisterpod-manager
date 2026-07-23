import { describe, expect, it } from 'vitest'
import { parseBlisterpodCSV, parseMoxfieldCSV } from './collectionImport'

// Tier 3a smoke test: pure renderer logic, no DOM and no bridge. First thing to
// reach for when adding real coverage -- these parsers have no dependencies at all.
describe('collectionImport', () => {
    it('parses a blisterpod export', () => {
        const csv = [
            'set_code,collector_number,quantity_nonfoil,quantity_foil',
            'GTC,54,2,1',
            'BFZ,163,1,0',
        ].join('\n')

        expect(parseBlisterpodCSV(csv)).toEqual([
            { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1, createdAt: undefined, updatedAt: undefined },
            { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 1, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
        ])
    })

    it('returns nothing when the required headers are missing', () => {
        expect(parseBlisterpodCSV('foo,bar\n1,2')).toEqual([])
    })

    it('merges foil and nonfoil rows of the same printing in a moxfield export', () => {
        const csv = [
            'Count,Edition,Collector Number,Foil',
            '2,gtc,54,False',
            '1,gtc,54,True',
        ].join('\n')

        expect(parseMoxfieldCSV(csv)).toEqual([
            { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1 },
        ])
    })
})
