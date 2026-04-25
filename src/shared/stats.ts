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
