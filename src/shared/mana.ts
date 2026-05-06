export const COLOR_SYMBOL_MAP: Record<string, string> = {
  W: 'mana-symbol://app/W.svg',
  U: 'mana-symbol://app/U.svg',
  B: 'mana-symbol://app/B.svg',
  R: 'mana-symbol://app/R.svg',
  G: 'mana-symbol://app/G.svg',
  C: 'mana-symbol://app/C.svg',
}

export const WUBRG_ORDER: string[] = ['W', 'U', 'B', 'R', 'G']

const COLOR_PAIRS: Record<string, string> = {
  'WU': 'WU', // Azorius
  'UB': 'UB', // Dimir
  'BR': 'BR', // Rakdos
  'RG': 'RG', // Gruul
  'WG': 'GW', // Selesnya
  'WB': 'WB', // Orzhov
  'UR': 'UR', // Izzet
  'BG': 'BG', // Golgari
  'WR': 'RW', // Boros
  'UG': 'GU'  // Simic
}

const COLOR_TRIADS: Record<string, string> = {
  'WUB': 'WUB', // Esper
  'UBR': 'UBR', // Grixis
  'BRG': 'BRG', // Jund
  'WRG': 'RGW', // Naya
  'WUG': 'GWU', // Bant
  'WBG': 'WBG', // Abzan
  'WBR': 'RWB', // Mardu
  'URG': 'GUR', // Temur
  'UBG': 'BGU', // Sultai
  'WUR': 'URW'  // Jeskai
}

const COLOR_QUARTETS: Record<string, string> = {
  'WUBR': 'WUBR', // Yore-Tiller
  'UBRG': 'UBRG', // Glint-Eye
  'WRGB': 'BRGW', // Dune-Brood
  'WURG': 'RGWU', // Ink-Treader
  'WUBG': 'GWUB'  // Witch-Maw
}

export function getManaSymbolUrl(symbol: string): string {
  const cost = symbol.toUpperCase().replace(/[{}]/g, '') // Remove curly braces if present
  const parsedCost = cost.replace(/\//g, '') // Remove slashes if present
  return `mana-symbol://app/${parsedCost}.svg`
}

/**
 * 
 * @param colors Color array to order
 * @param isOrdered Whether the color array is already ordered (WUBRG order)
 * @returns Ordered color array symbols
 */
export function setStandardColorOrder(colors: string[], isOrdered: boolean = true): string[] {
  if (colors.length < 2) {
    return colors
  }
  
  let colorsToOrder = colors
  if (!isOrdered) {
    colorsToOrder = colors.sort((a, b) => WUBRG_ORDER.indexOf(a) - WUBRG_ORDER.indexOf(b))
  }
  const colorString = colorsToOrder.join('')

  if (colors.length === 2 && COLOR_PAIRS[colorString]) {
    return COLOR_PAIRS[colorString].split('')
  }

  if (colors.length === 3 && COLOR_TRIADS[colorString]) {
    return COLOR_TRIADS[colorString].split('')
  }

  if (colors.length === 4 && COLOR_QUARTETS[colorString]) {
    return COLOR_QUARTETS[colorString].split('')
  }

  return colorsToOrder
}

/**
 * 
 * @param manaCost Mana cost of a card
 * @returns The mana cost symbols array
 */
export function setManaCostSymbols(manaCost: string[]): (string)[] {
  const symbols: string[] = []
  manaCost.forEach(cost => {
    const url = getManaSymbolUrl(cost)
    if (url) {
      symbols.push(cost)
    }
  })
  return symbols
}
