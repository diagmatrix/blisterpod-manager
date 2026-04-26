export interface Card {
    name?: string | null
    set_code: string
    collector_number: string
}

export interface ScryfallCard extends Card {
    scryfall_id: string | null
    oracle_id: string | null
    set_name: string
    image_url: string | null
    rarity: string | null
    value_nonfoil?: number | null
    value_foil?: number | null
    collector_number_normalised?: number | null
    color_identity: string | null  // JSON array string, e.g. '["W","U"]'
}

export interface CollectionCard extends ScryfallCard {
    collection_id: number
    base_set_code: string
    quantity_nonfoil: number
    quantity_foil: number
    total: number
    is_token: number // 1 = token, 0 = non-token
    value: number | null
}

export interface MissingCard extends Card {
    collection_id: number
    quantity_nonfoil: number
    quantity_foil: number
    set_cards_missing: number  // 0 | 1
    set_metadata_missing: number  // 0 | 1
}

export interface DuplicateCard extends Card {
  row_count: number
  total_nonfoil: number
  total_foil: number
  row_ids: string
}

export interface CardDetail extends CollectionCard {
  type_line: string | null
  mana_costs: string | null    // JSON array string, one entry per face
  oracle_texts: string | null  // JSON array string, one entry per face
  image_urls: string | null    // JSON array string, one entry per face
  color_identity: string | null
  rarity: string | null
}

export function missingCardToCollectionCard(missing: MissingCard): CollectionCard {
    return {
        set_name: missing.set_code,
        base_set_code: missing.set_code,
        total: missing.quantity_nonfoil + missing.quantity_foil,
        is_token: 0,
        value: 0,
        scryfall_id: null,
        oracle_id: null,
        image_url: null,
        rarity: null,
        color_identity: null,
        ...missing,
    }
}
