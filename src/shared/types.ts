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

// Matches the mapped_collection view columns exactly
export interface CollectionCard {
  scryfall_id: string | null
  card_name: string
  set_code: string
  collector_number: string
  quantity_nonfoil: number
  quantity_foil: number
  total: number
  color_identity: string | null // JSON array string, e.g. '["W","U"]'
  rarity: string | null
  is_token: number              // 1 = token, 0 = non-token (SQLite CASE result)
  image_url: string | null      // Scryfall 'normal' image URI (488x680)
  value: number | null          // EUR total value (nonfoil * eur + foil * eur_foil)
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
  colorMode?: 'including' | 'atLeast' | 'exactly'
}

export interface CollectionListResponse {
  rows: CollectionCard[]
  total: number
}

export const COLOR_SYMBOL_MAP: Record<string, string> = {
  W: wSvg,
  U: uSvg,
  B: bSvg,
  R: rSvg,
  G: gSvg,
  C: cSvg,
}