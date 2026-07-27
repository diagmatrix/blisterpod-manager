import { describe, expect, it } from 'vitest'
import { parseCSVFile } from './collectionImport'

describe('collectionImport', () => {
    describe('blisterpod', () => {
        it('parses a blisterpod export', () => {
            const csv = [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                'GTC,54,2,1',
                'BFZ,163,1,0',
            ].join('\n')

            expect(parseCSVFile(csv, 'blisterpod')).toEqual({
                cards: [
                    { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1, createdAt: undefined, updatedAt: undefined },
                    { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 1, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                ],
                error: undefined,
            })
        })

        it('passes through created_at and updated_at when present', () => {
            const csv = [
                'set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at',
                'GTC,54,2,1,2024-01-02T03:04:05.000Z,2024-02-03T04:05:06.000Z',
            ].join('\n')

            expect(parseCSVFile(csv, 'blisterpod')).toEqual({
                cards: [
                    {
                        setCode: 'GTC',
                        collectorNumber: '54',
                        quantityNonfoil: 2,
                        quantityFoil: 1,
                        createdAt: '2024-01-02T03:04:05.000Z',
                        updatedAt: '2024-02-03T04:05:06.000Z',
                    },
                ],
                error: undefined,
            })
        })

        it('skips rows whose quantities sum to zero and reports them', () => {
            const csv = [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                'GTC,54,0,0',
                'BFZ,163,1,0',
            ].join('\n')

            expect(parseCSVFile(csv, 'blisterpod')).toEqual({
                cards: [
                    { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 1, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                ],
                error: '1 rows were not imported due to invalid quantity values',
            })
        })

        it('skips rows with negative quantities', () => {
            const csv = [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                'GTC,54,-1,0',
            ].join('\n')

            expect(parseCSVFile(csv, 'blisterpod')).toEqual({
                cards: [],
                error: '1 rows were not imported due to invalid quantity values',
            })
        })

        it('reports missing set code and collector number separately', () => {
            const csv = [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                ',54,1,0',
                'BFZ,,1,0',
            ].join('\n')

            expect(parseCSVFile(csv, 'blisterpod')).toEqual({
                cards: [],
                error: '1 rows were not imported due to missing the set code. 1 rows were not imported due to missing the collector number',
            })
        })

        it('returns nothing when the required headers are missing', () => {
            expect(parseCSVFile('foo,bar\n1,2', 'blisterpod')).toEqual({
                cards: [],
                error: 'Missing set_code and/or collector_number columns',
            })
        })

        it('returns an error when the file has no data rows', () => {
            expect(parseCSVFile('set_code,collector_number,quantity_nonfoil,quantity_foil', 'blisterpod')).toEqual({
                cards: [],
                error: 'File contains no rows',
            })
        })
    })

    describe('moxfield', () => {
        it('merges foil and nonfoil rows of the same printing', () => {
            const csv = [
                'Count,Edition,Collector Number,Foil',
                '2,gtc,54,False',
                '1,gtc,54,True',
            ].join('\n')

            expect(parseCSVFile(csv, 'moxfield')).toEqual({
                cards: [
                    { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1 },
                ],
                error: undefined,
            })
        })

        it('skips rows with non-positive counts', () => {
            const csv = [
                'Count,Edition,Collector Number,Foil',
                '0,gtc,54,False',
                '2,bfz,163,False',
            ].join('\n')

            expect(parseCSVFile(csv, 'moxfield')).toEqual({
                cards: [
                    { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 2, quantityFoil: 0 },
                ],
                error: '1 rows were not imported due to invalid quantity values',
            })
        })

        it('returns nothing when the required headers are missing', () => {
            expect(parseCSVFile('foo,bar\n1,2', 'moxfield')).toEqual({
                cards: [],
                error: 'Missing Edition and/or Collector Number columns',
            })
        })
    })

    describe('manabox', () => {
        it('merges foil and nonfoil rows of the same printing', () => {
            const csv = [
                'Quantity,Set code,Collector number,Foil',
                '2,gtc,54,normal',
                '1,gtc,54,foil',
            ].join('\n')

            expect(parseCSVFile(csv, 'manabox')).toEqual({
                cards: [
                    { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1 },
                ],
                error: undefined,
            })
        })

        it('treats any non-normal finish as foil', () => {
            const csv = [
                'Quantity,Set code,Collector number,Foil',
                '3,neo,100,etched',
            ].join('\n')

            expect(parseCSVFile(csv, 'manabox')).toEqual({
                cards: [
                    { setCode: 'NEO', collectorNumber: '100', quantityNonfoil: 0, quantityFoil: 3 },
                ],
                error: undefined,
            })
        })

        it('skips rows with non-positive quantities', () => {
            const csv = [
                'Quantity,Set code,Collector number,Foil',
                '0,gtc,54,normal',
            ].join('\n')

            expect(parseCSVFile(csv, 'manabox')).toEqual({
                cards: [],
                error: '1 rows were not imported due to invalid quantity values',
            })
        })

        it('returns nothing when the required headers are missing', () => {
            expect(parseCSVFile('foo,bar\n1,2', 'manabox')).toEqual({
                cards: [],
                error: 'Missing Set code and/or Collector number columns',
            })
        })
    })

    describe('google-drive', () => {
        it('parses an export, skipping preamble rows before the header', () => {
            const csv = [
                'My Collection,,,,',
                ',,,,',
                'NAME,SET,NUMBER,QUANTITY',
                'Lightning Bolt,LEA,161,3',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'LEA', collectorNumber: '161', quantityNonfoil: 3, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                ],
                error: undefined,
            })
        })

        it('merges (F) foil rows with their nonfoil printing and parses dates', () => {
            const csv = [
                'NAME,SET,NUMBER,QUANTITY,ADDED,LAST MODIFIED',
                'Lightning Bolt,LEA,161,3,01/06/2024,02/06/2024',
                'Lightning Bolt (F),LEA,161,1,05/06/2024,06/06/2024',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    {
                        setCode: 'LEA',
                        collectorNumber: '161',
                        quantityNonfoil: 3,
                        quantityFoil: 1,
                        createdAt: new Date(2024, 5, 1).toISOString(),
                        updatedAt: new Date(2024, 5, 2).toISOString(),
                    },
                ],
                error: undefined,
            })
        })

        it('falls back to the TYPE column when NAME is absent', () => {
            const csv = [
                'TYPE,SET,NUMBER,QUANTITY',
                'Creature (F),NEO,100,2',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'NEO', collectorNumber: '100', quantityNonfoil: 0, quantityFoil: 2, createdAt: undefined, updatedAt: undefined },
                ],
                error: undefined,
            })
        })

        it('keeps columns aligned when a field is quoted', () => {
            const csv = [
                'NAME,SET,NUMBER,QUANTITY',
                '"Krenko, Mob Boss",DMR,145,2',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'DMR', collectorNumber: '145', quantityNonfoil: 2, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                ],
                error: undefined,
            })
        })

        it('skips rows with non-positive quantities', () => {
            const csv = [
                'NAME,SET,NUMBER,QUANTITY',
                'Lightning Bolt,LEA,161,0',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [],
                error: '1 rows were not imported due to invalid quantity values',
            })
        })

        // `csvQuote` escapes a quote as `""`, so a name carrying one has to survive the
        // round trip without swallowing the delimiters that follow it.
        it('decodes doubled quotes inside a quoted field', () => {
            const csv = [
                'NAME,SET,NUMBER,QUANTITY',
                '"Kongming, ""Sleeping Dragon""",PTK,44,2',
                '"Ach! Hans, Run! (F)",UNH,1,3',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'PTK', collectorNumber: '44', quantityNonfoil: 2, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                    { setCode: 'UNH', collectorNumber: '1', quantityNonfoil: 0, quantityFoil: 3, createdAt: undefined, updatedAt: undefined },
                ],
                error: undefined,
            })
        })

        it('returns an error when the header row cannot be found', () => {
            const csv = [
                'foo,bar,baz',
                '1,2,3',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [],
                error: 'Could not find column headers',
            })
        })
    })

    it('returns an error for an unknown provider', () => {
        expect(parseCSVFile('anything', 'invalid')).toEqual({
            cards: [],
            error: 'Invalid provider',
        })
    })
})
