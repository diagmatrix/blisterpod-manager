interface SetSymbolProps {
  setCode: string
  setName?: string | null
  rarity?: string | null
  size?: string
  collectorNumber?: string | null
}

// Scryfall set codes that don't match keyrune's glyph names.
const KEYRUNE_ALIASES: Record<string, string> = {
  psal: 'psalvat05',
  ps11: 'psalvat11',
  dci: 'parl',
}

function getDisplayCode(setCode: string, collectorNumber?: string | null): string {
  const alias = KEYRUNE_ALIASES[setCode.toLowerCase()]
  if (alias) {
    return alias
  }

  if (!collectorNumber) {
    return setCode
  }

  // Check for The List cards
  if (setCode.toLowerCase() !== 'plst') {
    return setCode
  }

  const match = collectorNumber.match(/^([A-Za-z0-9]+)-/)
    if (match) {
      return match[1]
    }

    return setCode
}

export function SetSymbol({ setCode, setName, rarity, size = '1.2rem', collectorNumber }: SetSymbolProps) {
  if (!setCode) return null

  const displayCode = getDisplayCode(setCode, collectorNumber)
  const displayName = setName ?? setCode.toUpperCase()
  const rarityClass = rarity ? `ss-${rarity}` : ''

  return (
    <i
      className={`ss ss-${displayCode.toLowerCase()} ${rarityClass} ss-grad ss-fw`}
      title={displayName}
      style={{ fontSize: size }}
    />
  )
}
