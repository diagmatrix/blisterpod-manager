import wSvg from '../../resources/mana-symbols/w.svg'
import uSvg from '../../resources/mana-symbols/u.svg'
import bSvg from '../../resources/mana-symbols/b.svg'
import rSvg from '../../resources/mana-symbols/r.svg'
import gSvg from '../../resources/mana-symbols/g.svg'
import cSvg from '../../resources/mana-symbols/c.svg'

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export interface AppSettings {
  windowBounds: WindowBounds
  theme: 'dark' | 'light'
}

export type Theme = 'dark' | 'light'

export interface ScryfallCard {
  scryfall_id: string | null
  name: string
  set_name: string
  set_code: string
  collector_number: string
  image_url: string | null
  rarity: string | null
  value_nonfoil?: number | null
  value_foil?: number | null
  collector_number_normalised?: number | null
  color_identity: string | null  // JSON array string, e.g. '["W","U"]'
}

// Matches the mapped_collection view — extends ScryfallCard, overrides name alias
export interface CollectionCard extends Omit<ScryfallCard, 'name'> {
  collection_id: number         // cards.id (primary key for mutations)
  card_name: string             // ScryfallCard.name aliased in the view
  base_set_code: string         // parent set code for promos, otherwise same as set_code
  quantity_nonfoil: number
  quantity_foil: number
  total: number
  is_token: number              // 1 = token, 0 = non-token
  value: number | null          // EUR total (nonfoil * eur + foil * eur_foil)
}

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

// BM-04 stats types
export interface StatsSummary {
  uniquePrintings: number
  uniqueNames: number
  totalCards: number
  estimatedValue: number
}

export interface StatsColors {
  white: number
  blue: number
  black: number
  red: number
  green: number
  colorless: number
  multicolored: number
}

export interface StatsRarityEntry {
  rarity: string
  totalCards: number
}


export interface StatsSetEntry {
  set_code: string
  set_name: string
  base_set_code: string
  total_cards: number
  unique_printings: number
  set_cards: number
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  context: string
  message: string
  data?: unknown
}

export const COLOR_SYMBOL_MAP: Record<string, string> = {
  W: wSvg,
  U: uSvg,
  B: bSvg,
  R: rSvg,
  G: gSvg,
  C: cSvg,
}