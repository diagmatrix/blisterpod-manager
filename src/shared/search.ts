import type { CollectionCard, ScryfallCard } from './cards'

export interface CollectionListParams {
  page: number
  pageSize: number
  sortColumn?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
  searchSet?: string
  tokenFilter?: 'all' | 'cards' | 'tokens'
  rarities?: string[]
  colors?: string[]
  colorMode?: 'atLeast' | 'exactly' | 'atMost'
}

export interface CollectionListResponse {
  rows: CollectionCard[]
  total: number
}

export interface BatchItem {
  card: ScryfallCard
  quantity_nonfoil: number
  quantity_foil: number
}

export interface CollectionAddParams {
  set_code: string
  collector_number: string
  quantity_nonfoil: number
  quantity_foil: number
}

export interface CollectionUpdateParams {
  id: number
  quantity_nonfoil: number
  quantity_foil: number
  set_code?: string
  collector_number?: string
}

export interface CardSearchParams {
  query?: string
  set_code?: string
  rarities?: string[]
  colors?: string[]
  colorMode?: 'atLeast' | 'exactly' | 'atMost'
  page?: number
  pageSize?: number
}

export interface CardSearchResponse {
  rows: ScryfallCard[]
  total: number
}
