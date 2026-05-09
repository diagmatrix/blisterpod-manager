import type { CollectionCard, ScryfallCard, CardDetail } from './cards'

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
  created_at?: string
  updated_at?: string
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
  sortColumn?: string
  sortOrder?: 'ASC' | 'DESC'
  page?: number
  pageSize?: number
}

export interface CardSearchResponse {
  rows: ScryfallCard[]
  total: number
}

export interface CardDetailParams {
  set_code: string
  collector_number: string
}

export interface CardDetailResponse {
  card: CardDetail
}

export interface OtherPrintingParams {
  oracle_id: string
  scryfall_id: string
}

export interface OtherPrintingsResponse {
  other_printings: CollectionCard[]
}
