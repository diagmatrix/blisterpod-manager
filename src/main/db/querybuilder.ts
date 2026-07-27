import { CardSearchParams, ColorMode, LayoutFilter, SortParams } from "../../models/search"
import { getColorsComplement, WUBRG_ORDER } from '../../models/mana'

const VALID_RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
const VALID_COLOR_MODES = ['atLeast', 'exactly', 'atMost']
const VALID_SORT_COLUMNS = ['name', 'set_code', 'collector_number_normalised', 'rarity', 'color_identity', 'released_at', 'mana_value', 'value', 'total']
const VALID_SORT_ORDERS = ['ASC', 'DESC']
const VALID_LAYOUT_FILTERS = ['all', 'cards', 'tokens']
export const VALID_TABLE_NAMES = ['mapped_collection', 'scryfall_cards_formatted']
export const MAX_PAGE_SIZE = 120

const DEFAULT_COLOR_MODE = 'atLeast'
const DEFAULT_SORT_COLUMN = 'collector_number_normalised'
const DEFAULT_SORT_DIRECTION = 'ASC'

export const BASE_QUERY = 'SELECT *, count(*) OVER () AS total_count FROM'
export const NAME_SEARCH_CONDITION = 'name LIKE ?'
export const SET_CODE_SEARCH_CONDITION = 'set_code LIKE ?'
export const COLOR_IDENTITY_SEARCH_CONDITION = 'instr(color_identity, ?) > 0'
export const COLOR_IDENTITY_MISSING_SEARCH_CONDITION = 'instr(color_identity, ?) = 0'
export const COLOR_IDENTITY_TOTAL_SEARCH_CONDITION = 'json_array_length(color_identity) = ?'
export const LAYOUT_FILTER_CONDITION = 'is_token = ?'

interface Query {
    sql: string
    values: (string | number)[]
}

function buildLikeCondition(sql: string, value: string): Query {
    return {
        sql: sql,
        values: [`%${value}%`]
    }
}

function buildRaritiesCondition(rarities: string[]): Query {
    const baseCondition = 'rarity IN ( '
    const raritiesAsParams = rarities.map(() => '?').join(', ')
    const condition = baseCondition + raritiesAsParams + ' )'
    return {
        sql: condition,
        values: rarities
    }
}

function buildColorIdentityCondition(colors: string[], colorMode: string): Query {
    const sqlConditions: string[] = []
    const values: (string | number)[] = []

    const nonColorlessArray = colors.filter((c) => c !== 'C')

    switch (colorMode) {
        case 'atLeast':
            nonColorlessArray.forEach((c) => {
                sqlConditions.push(COLOR_IDENTITY_SEARCH_CONDITION)
                values.push(c)
            })
            break
        case 'exactly':
            // Total
            sqlConditions.push(COLOR_IDENTITY_TOTAL_SEARCH_CONDITION)
            values.push(nonColorlessArray.length)
            // Colors (If colorless, array is empty)
            nonColorlessArray.forEach((c) => {
                sqlConditions.push(COLOR_IDENTITY_SEARCH_CONDITION)
                values.push(c)
            })
            break
        case 'atMost':
            // Total
            sqlConditions.push(COLOR_IDENTITY_TOTAL_SEARCH_CONDITION)
            values.push(nonColorlessArray.length)
            if (nonColorlessArray.length > 0) {
                const colorsToRemove = getColorsComplement(nonColorlessArray)
                colorsToRemove.forEach((c) => {
                    sqlConditions.push(COLOR_IDENTITY_MISSING_SEARCH_CONDITION)
                    values.push(c)
                })
            }
            break
        default:
            throw Error('Unreachable code')
    }

    return {
        sql: sqlConditions.join(' AND '),
        values: values
    }
}

function buildLayoutCondition(layoutFilter: string): Query {
    const layoutFilterValue = layoutFilter === 'cards' ? 0 : 1

    return {
        sql: LAYOUT_FILTER_CONDITION,
        values: [layoutFilterValue]
    }
}

function buildQuerySortCondition(sortParams: SortParams[]): string {
    if (sortParams.length === 0) {
        return ''
    }

    let sortCondition = ''
    for (const { sortColumn, sortDirection } of sortParams.sort((a, b) => a.sortOrder - b.sortOrder)) {
        sortCondition = sortCondition === '' ? `ORDER BY ${sortColumn} ${sortDirection}` : `${sortCondition}, ${sortColumn} ${sortDirection}`
    }

    return sortCondition
}

function validateSearchParams(params: CardSearchParams): CardSearchParams {
    const rarities: string[] = []
    for (const rarity of params.rarities ?? []) {
        if (VALID_RARITIES.includes(rarity) && !rarities.includes(rarity)) {
            rarities.push(rarity)
        }
    }

    const colorIdentity: string[] = []
    for (const color of params.colorIdentity ?? []) {
        if (WUBRG_ORDER.includes(color) && !colorIdentity.includes(color)) {
            colorIdentity.push(color)
        }
    }
    let colorMode: ColorMode | undefined
    if (colorIdentity.length > 0) {
        const colorModeRaw = params.colorMode ?? DEFAULT_COLOR_MODE
        colorMode = VALID_COLOR_MODES.includes(colorModeRaw) ? colorModeRaw : DEFAULT_COLOR_MODE
    }

    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 60, MAX_PAGE_SIZE)
    const setCode = params.setCode ? params.setCode.toUpperCase() : params.setCode

    const sortParamsRaw = [...params.sort ?? []].sort((a, b) => a.sortOrder - b.sortOrder) ?? []
    const sort: SortParams[] = []
    const sortedColumns: string[] = []
    let sortOrder = 1
    for (const sortParams of sortParamsRaw) {
        const sortColumn = sortParams.sortColumn ?? DEFAULT_SORT_COLUMN
        const sortDirection = VALID_SORT_ORDERS.includes(sortParams.sortDirection) ? sortParams.sortDirection : DEFAULT_SORT_DIRECTION
        if ((VALID_SORT_COLUMNS.includes(sortColumn) || sortColumn === DEFAULT_SORT_COLUMN) && !sortedColumns.includes(sortColumn)) {
            sort.push({ sortColumn: sortColumn, sortDirection: sortDirection, sortOrder: sortOrder })
            sortOrder++
            sortedColumns.push(sortColumn)
        }
    }

    let layoutFilter: LayoutFilter | undefined
    if (params.layoutFilter && VALID_LAYOUT_FILTERS.includes(params.layoutFilter)) {
        layoutFilter = params.layoutFilter
    }

    return {
        cardName: params.cardName,
        setCode: setCode,
        rarities: rarities,
        colorIdentity: colorIdentity,
        colorMode: colorMode,
        layoutFilter: layoutFilter,
        sort: sort,
        page: page,
        pageSize: pageSize
    }
}

function buildQueryConditions(params: CardSearchParams): Query {
    const conditions: Query[] = []

    if (params.cardName) {
        conditions.push(buildLikeCondition(NAME_SEARCH_CONDITION, params.cardName))
    }

    if (params.setCode) {
        conditions.push(buildLikeCondition(SET_CODE_SEARCH_CONDITION, params.setCode))
    }

    if (params.rarities && params.rarities.length > 0) {
        conditions.push(buildRaritiesCondition(params.rarities))
    }

    if (params.colorIdentity && params.colorIdentity.length > 0 && params.colorMode) {
        conditions.push(buildColorIdentityCondition(params.colorIdentity, params.colorMode))
    }

    if (params.layoutFilter && params.layoutFilter !== 'all') {
        conditions.push(buildLayoutCondition(params.layoutFilter))
    }

    return {
        sql: conditions.map((c) => c.sql).join(' AND '),
        values: conditions.flatMap((c) => c.values),
    }
}

export function buildFullQuery(params: CardSearchParams, tableName: string, additional_conditions?: string[]): Query {
    params = validateSearchParams(params)
    if (!VALID_TABLE_NAMES.includes(tableName)) {
        return { sql: '', values: [] }
    }

    const { sql, values } = buildQueryConditions(params)
    let whereSQL = sql !== '' ? ` WHERE ${sql}` : ''
    if (additional_conditions && additional_conditions.length > 0) {
        const start = whereSQL === '' ? ' WHERE ' : ' AND '
        const conditions = additional_conditions.join(' AND ')
        whereSQL = `${whereSQL}${start}${conditions}`
    }
    const orderSQL = buildQuerySortCondition(params.sort ?? [])
    const paramsSpace = whereSQL === '' && orderSQL === '' ? '' : ' '
    const queryParamsSQL = `${whereSQL}${paramsSpace}${orderSQL}`

    // Maybe refactor as it is validated before that is not null
    const pageSize = params.pageSize ?? 1
    const page = params.page ?? 1
    const offset = (page - 1) * pageSize
    values.push(pageSize, offset)

    const baseSQL = `${BASE_QUERY} ${tableName}`
    const space = queryParamsSQL.endsWith(' ') ? '' : ' '
    const finalSQL = `${baseSQL}${queryParamsSQL}${space}LIMIT ? OFFSET ?`

    return { sql: finalSQL, values: values }
}
