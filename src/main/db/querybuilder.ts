import { CardSearchParams } from "../../shared/search"
import { WUBRG_ORDER } from '../../shared/mana'
import { filterArrayContents } from "../utils"

const VALID_RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
const VALID_COLOR_MODES = ['atLeast', 'exactly', 'atMost']
const VALID_SORT_COLUMNS = ['name', 'set_code', 'collector_number', 'rarity', 'color_identity', 'released_at']
const VALID_LAYOUT_FILTERS = ['all', 'cards', 'tokens']

const DEFAULT_COLOR_MODE = 'atLeast'
const DEFAULT_SORT_COLUMN = 'collector_number'
const DEFAULT_SORT_ORDER = 'ASC'
const DEFAULT_LAYOUT_FILTER = 'cards'

const NAME_SEARCH_CONDITION = 'name LIKE ?'
const SET_CODE_SEARCH_CONDITION = 'set_code LIKE ?'
const COLOR_IDENTITY_SEARCH_CONDITION = 'instr(color_identity, ?) > 0'
const COLOR_IDENTITY_MISSING_SEARCH_CONDITION = 'instr(color_identity, ?) = 0'
const COLOR_IDENTITY_TOTAL_SEARCH_CONDITION = 'json_array_length(color_identity) = ?'
const LAYOUT_FILTER_CONDITION = 'is_token = ?'

interface QueryCondition {
    sql: string
    values: (string | number)[]
}

function buildLikeCondition(sql: string, value: string): QueryCondition {
    return {
        sql: sql,
        values: [`%${value}%`]
    }
}

function buildRaritiesCondition(rarities: string[]): QueryCondition {
    const baseCondition = 'rarity IN ( '
    const raritiesAsParams = rarities.map(() => '?').join(', ')
    const condition = baseCondition + raritiesAsParams + ' )'
    return {
        sql: condition,
        values: rarities
    }
}

function buildColorIdentityCondition(colors: string[], colorMode: string): QueryCondition {
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
                const colorsToRemove = WUBRG_ORDER.filter((validColor) => !nonColorlessArray.includes(validColor) && validColor !== 'C')
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

function buildLayoutCondition(layoutFilter: string): QueryCondition {
    const layoutFilterValue = layoutFilter === 'cards' ? 0 : 1
    
    return {
        sql: LAYOUT_FILTER_CONDITION,
        values: [layoutFilterValue]
    }
}

export function validateSearchParams(params: CardSearchParams): CardSearchParams {
    const rarities = filterArrayContents(params.rarities ?? [], VALID_RARITIES)
    const colorIdentity = filterArrayContents(params.colorIdentity ?? [], WUBRG_ORDER)    
    const sortOrder = params.sortOrder ?? DEFAULT_SORT_ORDER
    const page = params.page ?? 1
    const pageSize = Math.min(params.pageSize ?? 60, 120)
    const setCode = params.setCode ? params.setCode.toUpperCase() : params.setCode

    const colorModeRaw = params.colorMode ?? DEFAULT_COLOR_MODE
    const colorMode = VALID_COLOR_MODES.includes(colorModeRaw) ? colorModeRaw : DEFAULT_COLOR_MODE
    
    const sortColumnRaw = params.sortColumn ?? DEFAULT_SORT_COLUMN
    const sortColumn = VALID_SORT_COLUMNS.includes(sortColumnRaw) ? sortColumnRaw : DEFAULT_SORT_COLUMN

    const layoutFilterRaw = params.layoutFilter ?? DEFAULT_LAYOUT_FILTER
    const layoutFilter = VALID_LAYOUT_FILTERS.includes(layoutFilterRaw) ? layoutFilterRaw : DEFAULT_LAYOUT_FILTER

    return {
        cardName: params.cardName,
        setCode: setCode,
        rarities: rarities,
        colorIdentity: colorIdentity,
        colorMode: colorMode,
        sortColumn: sortColumn,
        sortOrder: sortOrder,
        layoutFilter: layoutFilter,
        page: page,
        pageSize: pageSize
    }
}

export function buildQueryConditions(params: CardSearchParams): QueryCondition {
    const conditions: QueryCondition[] = []

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
