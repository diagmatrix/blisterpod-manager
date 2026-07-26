import { describe, expect, it } from 'vitest'
import { CardSearchParams, ColorMode, SortParams } from '../../models/search'
import { BASE_QUERY, buildFullQuery, COLOR_IDENTITY_MISSING_SEARCH_CONDITION, COLOR_IDENTITY_SEARCH_CONDITION, COLOR_IDENTITY_TOTAL_SEARCH_CONDITION, LAYOUT_FILTER_CONDITION, MAX_PAGE_SIZE, NAME_SEARCH_CONDITION, SET_CODE_SEARCH_CONDITION, VALID_TABLE_NAMES } from './querybuilder'
import { getColorsComplement } from '../../models/mana'

interface TestValidationParams {
    params: CardSearchParams
    tableName: string
    expectedValues: (string|number)[]
    expectedSQL: string
    additionalConditions?: string[]
}

function validateQuery(params: TestValidationParams): void {
    const resultQuery = buildFullQuery(params.params, params.tableName, params.additionalConditions)
    expect(resultQuery.values).toEqual(params.expectedValues)
    expect(resultQuery.sql).toEqual(params.expectedSQL)
}

function raritySQL(times: number): string {
    const params = new Array<string>(times).fill('?')

    return `rarity IN ( ${params.join(', ')} )`
}

function colorIdentitySQL(sqlSnippet: string, times: number): string {
    const params = new Array<string>(times).fill(sqlSnippet)

    return params.join(' AND ')
}

describe('query builder', () => {
    const TABLE_NAME = VALID_TABLE_NAMES[0]
    const BASE_SQL = `${BASE_QUERY} ${TABLE_NAME}`
    const BASE_VALUES = [60, 0]

    const BASE_NAME_CONDITION = 'Jace Bel'
    const BASE_SET_CONDITION = 'eld'
    const BASE_LAYOUT = 'tokens'
    const BASE_PAGE_SIZE = 100
    const BASE_PAGE = 2
    const BASE_RARITY_CONDITION = ['common']
    const BASE_COLOR_IDENTITY = ['U', 'B']
    const BASE_COLOR_IDENTITY_COMPLEMENT = getColorsComplement(BASE_COLOR_IDENTITY)
    const BASE_COLOR_MODE = 'atLeast'
    const BASE_SORT_CONDITION: SortParams[] = [
        { sortOrder: 1, sortColumn: 'set_code', sortDirection: 'ASC' }
    ]
    const BASE_SORT_SQL = 'set_code ASC'
    
    describe('simple conditions', () => {
        it('builds a query by name', () => {
            const params: CardSearchParams = {
                cardName: BASE_NAME_CONDITION
            }
            const expectedSQL = `${BASE_SQL} WHERE ${NAME_SEARCH_CONDITION} LIMIT ? OFFSET ?`
            const expectedValues = [`%${BASE_NAME_CONDITION}%`, ...BASE_VALUES]
            
            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('builds a query by set_code', () => {
            const params: CardSearchParams = {
                setCode: BASE_SET_CONDITION
            }
            const expectedSQL = `${BASE_SQL} WHERE ${SET_CODE_SEARCH_CONDITION} LIMIT ? OFFSET ?`
            const expectedValues = [`%${BASE_SET_CONDITION.toUpperCase()}%`, ...BASE_VALUES]

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('builds a query with a layout filter', () => {
            const params: CardSearchParams = {
                layoutFilter: BASE_LAYOUT
            }
            const expectedValues = [params.layoutFilter === 'cards' ? 0 : 1, ...BASE_VALUES]
            const expectedSQL = `${BASE_SQL} WHERE ${LAYOUT_FILTER_CONDITION} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores invalid layout filters', () => {
            const params: CardSearchParams = {
                // @ts-expect-error -- deliberately invalid value for validation test
                layoutFilter: 'invalid_layout'
            }
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })

        it('builds a query with page size and page', () => {
            const params: CardSearchParams = {
                pageSize: BASE_PAGE_SIZE,
                page: BASE_PAGE
            }
            const expectedValues = [BASE_PAGE_SIZE, (BASE_PAGE - 1) * BASE_PAGE_SIZE]
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('sets an upper limit in a query with page size and page', () => {
            const params: CardSearchParams = {
                pageSize: 100000000000000,
                page: BASE_PAGE
            }
            const expectedValues = [MAX_PAGE_SIZE, (BASE_PAGE - 1) * MAX_PAGE_SIZE]
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })
    })
    
    describe('rarity conditions', () => {
        it.each([
            // Single rarity filter
            [BASE_RARITY_CONDITION, raritySQL(BASE_RARITY_CONDITION.length), BASE_RARITY_CONDITION],
            // Multiple rarities filter
            [['mythic', ...BASE_RARITY_CONDITION], raritySQL(BASE_RARITY_CONDITION.length + 1), ['mythic', ...BASE_RARITY_CONDITION]],
            // Duplicate rarities filter
            [[...BASE_RARITY_CONDITION, ...BASE_RARITY_CONDITION], raritySQL(BASE_RARITY_CONDITION.length), BASE_RARITY_CONDITION]
        ])('builds a query with rarity conditions', (rarityParam: string[], raritySQL: string, rarityValues: string[]) => {
            const params: CardSearchParams = {
                rarities: rarityParam
            }
            const expectedValues = [...rarityValues, ...BASE_VALUES]
            const expectedSQL = `${BASE_SQL} WHERE ${raritySQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores invalid rarity parameters', () => {
            const params: CardSearchParams = {
                rarities: ['invalid', 'rarity']
            }
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })
    })

    describe('color conditions', () => {
        it.each<[string[], ColorMode, string, (string|number)[]]>([
            // Color identity filter with 'atLeast'
            [
                BASE_COLOR_IDENTITY, 
                BASE_COLOR_MODE, 
                colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length), 
                BASE_COLOR_IDENTITY
            ],
            // Color identity filter with 'exactly'
            [
                BASE_COLOR_IDENTITY,
                'exactly',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION} AND ${colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length)}`,
                [BASE_COLOR_IDENTITY.length, ...BASE_COLOR_IDENTITY]
            ],
            // Color identity filter with 'atMost'
            [
                BASE_COLOR_IDENTITY,
                'atMost',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION} AND ${colorIdentitySQL(COLOR_IDENTITY_MISSING_SEARCH_CONDITION, BASE_COLOR_IDENTITY_COMPLEMENT.length)}`,
                [BASE_COLOR_IDENTITY.length, ...BASE_COLOR_IDENTITY_COMPLEMENT]
            ],
            // Color identity filter with 'atLeast' and duplicated colors
            [
                [...BASE_COLOR_IDENTITY, ...BASE_COLOR_IDENTITY], 
                BASE_COLOR_MODE, 
                colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length), 
                BASE_COLOR_IDENTITY
            ],
        ])('builds a query with color identity conditions', (colorIdenitity: string[], colorMode: ColorMode, sql: string, values: (string|number)[]) => {
            const params: CardSearchParams = {
                colorIdentity: colorIdenitity,
                colorMode: colorMode
            }
            const expectedValues = [...values, ...BASE_VALUES]
            const expectedSQL = `${BASE_SQL} WHERE ${sql} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it.each<[string[], ColorMode, string, (string|number)[]]>([
            // Color identity filter with 'atLeast' and colorless
            [
                [...BASE_COLOR_IDENTITY, 'C'], 
                BASE_COLOR_MODE, 
                colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length), 
                BASE_COLOR_IDENTITY
            ],
            // Color identity filter with 'exactly' and colorless
            [
                [...BASE_COLOR_IDENTITY, 'C'],
                'exactly',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION} AND ${colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length)}`,
                [BASE_COLOR_IDENTITY.length, ...BASE_COLOR_IDENTITY]
            ],
            // Color identity filter with 'atMost' and colorless
            [
                [...BASE_COLOR_IDENTITY, 'C'],
                'atMost',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION} AND ${colorIdentitySQL(COLOR_IDENTITY_MISSING_SEARCH_CONDITION, BASE_COLOR_IDENTITY_COMPLEMENT.length)}`,
                [BASE_COLOR_IDENTITY.length, ...BASE_COLOR_IDENTITY_COMPLEMENT]
            ],
            // Colorless color identity filter with 'exactly'
            [
                ['C'],
                'exactly',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION}`,
                [0]
            ],
            // Colorless color identity filter with 'atMost'
            [
                ['C'],
                'atMost',
                `${COLOR_IDENTITY_TOTAL_SEARCH_CONDITION}`,
                [0]
            ],
        ])('builds a query with color identity conditions that include colorless', (colorIdenitity: string[], colorMode: ColorMode, sql: string, vales: (string|number)[]) => {
            const params: CardSearchParams = {
                colorIdentity: colorIdenitity,
                colorMode: colorMode
            }
            const expectedValues = [...vales, ...BASE_VALUES]
            const expectedSQL = `${BASE_SQL} WHERE ${sql} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores color identity parameters if the filter is atLeast + Colorless', () => {
            const params: CardSearchParams = {
                colorIdentity: ['C'],
                colorMode: 'atLeast'
            }
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores invalid color identity parameters', () => {
            const params: CardSearchParams = {
                colorIdentity: ['invalid', 'color', 'identity']
            }
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })

        let UNDEFINED: undefined
        it.each<[(string|undefined)]>([
            // No color mode
            [UNDEFINED],
            // Invalid color mode
            ['invalid color mode']
        ])('builds a query with the correct color modes', (colorMode: string | undefined) => {
            const params: CardSearchParams = {
                colorIdentity: BASE_COLOR_IDENTITY,
                // @ts-expect-error -- deliberately invalid value for validation test
                colorMode: colorMode
            }
            const expectedValues = [...BASE_COLOR_IDENTITY, ...BASE_VALUES]
            const expectedSQL = `${BASE_SQL} WHERE ${colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length)} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: expectedValues, 
                expectedSQL: expectedSQL 
            })
        })
    })

    describe('sorting conditions', () => {
        it.each<[SortParams[], string]>([
            [BASE_SORT_CONDITION, BASE_SORT_SQL],
            [
                [...BASE_SORT_CONDITION, { sortOrder: 2, sortColumn: 'name', sortDirection: 'DESC' }],
                `${BASE_SORT_SQL}, name DESC`
            ],
            [
                [
                    { sortOrder: 5, sortColumn: 'rarity', sortDirection: 'ASC' },
                    { sortOrder: 2, sortColumn: 'name', sortDirection: 'DESC' },
                    ...BASE_SORT_CONDITION,
                ],
                `${BASE_SORT_SQL}, name DESC, rarity ASC`
            ]
        ])('builds a query with sort parameters', (sortParams: SortParams[], sortSQL: string) => {
            const params: CardSearchParams = {
                sort: sortParams
            }
            const expectedSQL = `${BASE_SQL} ORDER BY ${sortSQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores invalid sort parameters', () => {
            const params: CardSearchParams = {
                sort: [
                    { sortOrder: 2, sortColumn: 'invalid_column', sortDirection: 'DESC' }
                ]
            }
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })

        it('ignores duplicated sort parameters', () => {
            const params: CardSearchParams = {
                sort: [...BASE_SORT_CONDITION, ...BASE_SORT_CONDITION]
            }
            const expectedSQL = `${BASE_SQL} ORDER BY ${BASE_SORT_SQL} LIMIT ? OFFSET ?`

            validateQuery({ 
                params: params, 
                tableName: TABLE_NAME, 
                expectedValues: BASE_VALUES, 
                expectedSQL: expectedSQL 
            })
        })
    })

    describe('additional conditions', () => {
        const CALLER_CONDITION = 'scryfall_id IS NOT NULL'

        it('opens the WHERE clause when there is no other condition', () => {
            const params: CardSearchParams = {}
            const expectedSQL = `${BASE_SQL} WHERE ${CALLER_CONDITION} LIMIT ? OFFSET ?`

            validateQuery({
                params: params,
                tableName: TABLE_NAME,
                expectedValues: BASE_VALUES,
                expectedSQL: expectedSQL,
                additionalConditions: [CALLER_CONDITION]
            })
        })

        it('joins onto the conditions built from the parameters', () => {
            const params: CardSearchParams = {
                cardName: BASE_NAME_CONDITION,
                sort: BASE_SORT_CONDITION
            }
            const whereSQL = `WHERE ${NAME_SEARCH_CONDITION} AND ${CALLER_CONDITION}`
            const expectedSQL = `${BASE_SQL} ${whereSQL} ORDER BY ${BASE_SORT_SQL} LIMIT ? OFFSET ?`
            const expectedValues = [`%${BASE_NAME_CONDITION}%`, ...BASE_VALUES]

            validateQuery({
                params: params,
                tableName: TABLE_NAME,
                expectedValues: expectedValues,
                expectedSQL: expectedSQL,
                additionalConditions: [CALLER_CONDITION]
            })
        })

        it('chains several conditions together', () => {
            const params: CardSearchParams = {}
            const conditions = [CALLER_CONDITION, 'is_token = 0']
            const expectedSQL = `${BASE_SQL} WHERE ${conditions.join(' AND ')} LIMIT ? OFFSET ?`

            validateQuery({
                params: params,
                tableName: TABLE_NAME,
                expectedValues: BASE_VALUES,
                expectedSQL: expectedSQL,
                additionalConditions: conditions
            })
        })

        it('ignores an empty list of conditions', () => {
            const params: CardSearchParams = {}
            const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

            validateQuery({
                params: params,
                tableName: TABLE_NAME,
                expectedValues: BASE_VALUES,
                expectedSQL: expectedSQL,
                additionalConditions: []
            })
        })
    })

    it('builds a query without parameters', () => {
        const params: CardSearchParams = {}
        const expectedSQL = `${BASE_SQL} LIMIT ? OFFSET ?`

        validateQuery({ 
            params: params, 
            tableName: TABLE_NAME, 
            expectedValues: BASE_VALUES, 
            expectedSQL: expectedSQL 
        })
    })

    it('returns an empty query for invalid tables', () => {
        const params: CardSearchParams = {}
        const tableName = 'invalid_table'

        validateQuery({ 
            params: params, 
            tableName: tableName, 
            expectedValues: [], 
            expectedSQL: '' 
        })
    })

    it('returns a complex query', () => {
        const params: CardSearchParams = {
            cardName: BASE_NAME_CONDITION,
            setCode: BASE_SET_CONDITION,
            rarities: BASE_RARITY_CONDITION,
            colorIdentity: BASE_COLOR_IDENTITY,
            colorMode: BASE_COLOR_MODE,
            layoutFilter: BASE_LAYOUT,
            sort: BASE_SORT_CONDITION,
            page: BASE_PAGE,
            pageSize: BASE_PAGE_SIZE
        }
        const expectedValues = [
            `%${BASE_NAME_CONDITION}%`,
            `%${BASE_SET_CONDITION.toUpperCase()}%`,
            ...BASE_RARITY_CONDITION,
            ...BASE_COLOR_IDENTITY,
            params.layoutFilter === 'cards' ? 0 : 1,
            BASE_PAGE_SIZE,
            (BASE_PAGE - 1) * BASE_PAGE_SIZE
        ]
        const rSQL = raritySQL(BASE_RARITY_CONDITION.length)
        const ciSQL = colorIdentitySQL(COLOR_IDENTITY_SEARCH_CONDITION, BASE_COLOR_IDENTITY.length)
        const whereSQL = `WHERE ${NAME_SEARCH_CONDITION} AND ${SET_CODE_SEARCH_CONDITION} AND ${rSQL} AND ${ciSQL} AND ${LAYOUT_FILTER_CONDITION}`
        const expectedSQL = `${BASE_QUERY} ${TABLE_NAME} ${whereSQL} ORDER BY ${BASE_SORT_SQL} LIMIT ? OFFSET ?`

        validateQuery({ 
            params: params, 
            tableName: TABLE_NAME, 
            expectedValues: expectedValues, 
            expectedSQL: expectedSQL 
        })
    })
})