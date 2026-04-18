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
}

export interface CollectionListResponse {
  rows: CollectionCard[]
  total: number
}
