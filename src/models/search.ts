import type { ScryfallCard } from './cards'

export interface BatchItem {
    card: ScryfallCard
    quantity_nonfoil: number
    quantity_foil: number
}

export interface CardDetailParams {
    setCode: string
    collectorNumber: string
}

export interface SetCodeParams {
    setCode: string
}

export interface OtherPrintingParams {
    oracleID: string
    scryfallID: string
}

export interface CollectionAddParams {
    setCode: string
    collectorNumber: string
    quantityNonfoil: number
    quantityFoil: number
    createdAt?: string
    updatedAt?: string
}

export interface CollectionUpdateParams {
    id: number
    quantityNonfoil: number
    quantityFoil: number
    setCode?: string
    collectorNumber?: string
}

export type LayoutFilter = 'all' | 'cards' | 'tokens'
export type ColorMode = 'atLeast' | 'exactly' | 'atMost'
export type SortDirection = 'ASC' | 'DESC'

export interface SortParams {
    sortColumn: string
    sortOrder: number
    sortDirection: SortDirection
}

export interface SortRequest {
    sortColumn: string
    sortOrder?: number
    sortDirection?: SortDirection
}

export interface CardSearchParams {
    cardName?: string
    setCode?: string
    rarities?: string[]
    colorIdentity?: string[]
    colorMode?: ColorMode
    layoutFilter?: LayoutFilter
    sort?: SortParams[]
    page?: number
    pageSize?: number
}

export interface CardFiltersState {
    searchCardNameInput: string
    searchSetInput: string
    layoutFilter: LayoutFilter
    raritiesInput: string[]
    colorIdentityInput: string[]
    colorMode: ColorMode
}

export interface CardFiltersHandlers {
    setSearchCardNameInput: (v: string) => void
    setSearchSetInput: (v: string) => void
    setLayoutFilter: (v: LayoutFilter) => void
    toggleRarity: (r: string) => void
    toggleColorIdentity: (c: string) => void
    setColorMode: (m: ColorMode) => void
}

export interface UseCardFiltersReturn {
    filtersState: CardFiltersState
    filtersHandlers: CardFiltersHandlers
    searchCardName: string
    searchSet: string
    layoutFilter: LayoutFilter
    rarities: string[]
    colorIdentity: string[]
    colorMode: ColorMode
    reset: () => void
}
