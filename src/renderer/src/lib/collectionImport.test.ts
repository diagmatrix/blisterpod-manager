import { describe, expect, it } from 'vitest'
import { parseCSVFile } from './collectionImport'
import { CollectionAddParams } from '../../../models/search'
import { ProviderID } from '../../../models/transfers'

describe('collectionImport', () => {
    it.each<[ProviderID]>([
        // Google Drive is not included as it has a different header row logic
        ['blisterpod'], ['moxfield'], ['manabox']
    ])('returns nothing when the required headers are missing', (provider: ProviderID) => {
        const { cards, error } = parseCSVFile('foo,bar\n1,2', provider)

        expect(cards).toEqual([])
        expect(error).toContain('Missing')
        expect(error).toContain('columns')
    })

    it.each<[ProviderID]>([
        ['blisterpod'], ['moxfield'], ['manabox'], ['googleDrive']
    ])('returns an error when the file has no data rows', (provider: ProviderID) => {
        expect(parseCSVFile('only,header,row', provider)).toEqual({
            cards: [],
            error: 'File contains no rows',
        })
    })

    it.each([
        // Cards without dates
        [
            ['GTC,54,2,1', 'BFZ,163,1,0'],
            [
                { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1, createdAt: undefined, updatedAt: undefined },
                { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 1, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
            ]
        ],
        // Cards with dates
        [
            ['GTC,54,2,1,2024-01-02T03:04:05.000Z,2024-02-03T04:05:06.000Z'],
            [
                { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1, createdAt: '2024-01-02T03:04:05.000Z', updatedAt: '2024-02-03T04:05:06.000Z' }
            ]
        ],
        // Merges foil and nonfoil rows of the same printing
        [
            ['GTC,54,2,1', 'GTC,54,1,0'],
            [
                { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 3, quantityFoil: 1, createdAt: undefined, updatedAt: undefined }
            ]
        ],
    ])('parses a blisterpod export', (csvRows: string[], expectedCards: CollectionAddParams[]) => {
        const csv = [
            'set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at',
            ...csvRows
        ].join('\n')

        expect(parseCSVFile(csv, 'blisterpod')).toEqual({
            cards: expectedCards,
            error: undefined,
        })
    })

    it.each([
        // Cards
        [
            ['2,gtc,54,False', '1,eld,54,True'],
            [
                { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 0 },
                { setCode: 'ELD', collectorNumber: '54', quantityNonfoil: 0, quantityFoil: 1 }
            ]

        ],
        // Merges foil and nonfoil rows of the same printing
        [
            ['2,gtc,54,False', '1,gtc,54,True'],
            [{ setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1 }]
        ]
    ])('parses a moxfield export', (csvRows: string[], expectedCards: CollectionAddParams[]) => {
        const csv = [
            'Count,Edition,Collector Number,Foil',
            ...csvRows
        ].join('\n')

        expect(parseCSVFile(csv, 'moxfield')).toEqual({
            cards: expectedCards,
            error: undefined,
        })
    })

    it.each([
        // Cards
        [
            ['2,GTC,54,normal', '1,ELD,54,foil'],
            [
                { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 0 },
                { setCode: 'ELD', collectorNumber: '54', quantityNonfoil: 0, quantityFoil: 1 }
            ]

        ],
        // Merges foil and nonfoil rows of the same printing
        [
            ['2,GTC,54,normal', '1,GTC,54,foil'],
            [{ setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1 }]
        ]
    ])('parses a manabox export', (csvRows: string[], expectedCards: CollectionAddParams[]) => {
        const csv = [
            'Quantity,Set code,Collector number,Foil',
            ...csvRows
        ].join('\n')

        expect(parseCSVFile(csv, 'manabox')).toEqual({
            cards: expectedCards,
            error: undefined,
        })
    })

    it.each([
        // Cards
        [
            ['Opt (F),ELD,59,1', 'Opt,STA,19,2'],
            [
                { setCode: 'ELD', collectorNumber: '59', quantityNonfoil: 0, quantityFoil: 1 },
                { setCode: 'STA', collectorNumber: '19', quantityNonfoil: 2, quantityFoil: 0 }
            ]

        ],
        // Merges foil and nonfoil rows of the same printing
        [
            ['Opt (F),ELD,59,1', 'Opt,ELD,59,2'],
            [{ setCode: 'ELD', collectorNumber: '59', quantityNonfoil: 2, quantityFoil: 1 }]
        ]
    ])('parses a google drive export', (csvRows: string[], expectedCards: CollectionAddParams[]) => {
        const csv = [
            'NAME,SET,NUMBER,QUANTITY',
            ...csvRows
        ].join('\n')

        expect(parseCSVFile(csv, 'googleDrive')).toEqual({
            cards: expectedCards,
            error: undefined,
        })
    })

    it.each<[ProviderID, string[]]>([
        // Blisterpod
        [
            'blisterpod',
            [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                'GTC,54,0,0',
                'BFZ,163,-1,1',
                'M11,2,0,-1',
            ]
        ],
        // Moxfield
        [
            'moxfield',
            [
                'Count,Edition,Collector Number,Foil',
                '0,gtc,54,False',
                '0,bfz,163,True',
                '-1,m11,2,False',
            ]
        ],
        // Manabox
        [
            'manabox',
            [
                'Quantity,Set code,Collector number,Foil',
                '0,gtc,54,normal',
                '0,gtc,45,foil',
                '-1,m11,2,normal',
            ]
        ],
        // Google Drive
        [
            'googleDrive',
            [
                'NAME,SET,NUMBER,QUANTITY',
                'Opt,XLN,65,0',
                'Opt (F),ELD,59,0',
                'Opt,STA,19,-1',
            ]
        ]
    ])('skips rows whose quantities sum to zero and reports them', (provider: ProviderID, csv: string[]) => {
        const expectedSkippedCount = csv.length - 1
        expect(parseCSVFile(csv.join('\n'), provider)).toEqual({
            cards: [],
            error: `${expectedSkippedCount} rows were not imported due to invalid quantity values`,
        })
    })

    it.each<[ProviderID, string]>([
        // Blisterpod
        [
            'blisterpod',
            [
                'set_code,collector_number,quantity_nonfoil,quantity_foil',
                ',54,0,0',
                'BFZ,,1,0',
            ].join('\n')
        ],
        // Moxfield
        [
            'moxfield',
            [
                'Count,Edition,Collector Number,Foil',
                '0,,54,False',
                '0,bfz,,True',
            ].join('\n')
        ],
        // Manabox
        [
            'manabox',
            [
                'Quantity,Set code,Collector number,Foil',
                '0,,54,normal',
                '0,gtc,,foil',
            ].join('\n')
        ],
        // Google Drive
        [
            'googleDrive',
            [
                'NAME,SET,NUMBER,QUANTITY',
                'Opt,,65,0',
                'Opt (F),ELD,,0',
            ].join('\n')
        ]
    ])('reports missing set code and collector number separately', (provider: ProviderID, csvString: string) => {
        expect(parseCSVFile(csvString, provider)).toEqual({
            cards: [],
            error: '1 rows were not imported due to missing the set code. 1 rows were not imported due to missing the collector number',
        })
    })

    it('returns an error for an unknown provider', () => {
        expect(parseCSVFile('anything', 'invalid')).toEqual({
            cards: [],
            error: 'Invalid provider',
        })
    })

    // Specific logic for each provider
    describe('manabox', () => {
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

        it('falls back to the TYPE column when NAME is absent', () => {
            const csv = [
                'TYPE,SET,NUMBER,QUANTITY',
                'FF (F),ECL,278,2',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'ECL', collectorNumber: '278', quantityNonfoil: 0, quantityFoil: 2, createdAt: undefined, updatedAt: undefined },
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

        it('decodes doubled quotes inside a quoted field', () => {
            const csv = [
                'NAME,SET,NUMBER,QUANTITY',
                '"Kongming, ""Sleeping Dragon""",PTK,9,2',
                '"""Ach! Hans, Run!"" (F)",UNH,116,3',
            ].join('\n')

            expect(parseCSVFile(csv, 'googleDrive')).toEqual({
                cards: [
                    { setCode: 'PTK', collectorNumber: '9', quantityNonfoil: 2, quantityFoil: 0, createdAt: undefined, updatedAt: undefined },
                    { setCode: 'UNH', collectorNumber: '116', quantityNonfoil: 0, quantityFoil: 3, createdAt: undefined, updatedAt: undefined },
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
})
