import type { CollectionCard, ScryfallCard, CardDetail } from './cards'

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

export interface CardSearchParams {
  cardName?: string
  setCode?: string
  rarities?: string[]
  colorIdentity?: string[]
  colorMode?: 'atLeast' | 'exactly' | 'atMost'
  layoutFilter?: 'all' | 'cards' | 'tokens'
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
