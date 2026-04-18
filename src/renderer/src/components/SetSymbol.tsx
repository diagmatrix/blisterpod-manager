interface SetSymbolProps {
  /** The set code, e.g. "10E", "NEO" */
  setCode: string
  /** Rarity for coloring: common, uncommon, rare, mythic */
  rarity?: string | null
  /** CSS font size, e.g. "1.2rem" */
  size?: string
}

export function SetSymbol({ setCode, rarity, size = '1.2rem' }: SetSymbolProps) {
  const rarityClass = rarity ? `ss-${rarity}` : ''

  return (
    <i
      className={`ss ss-${setCode.toLowerCase()} ${rarityClass} ss-grad ss-fw`}
      title={setCode.toUpperCase()}
      style={{ fontSize: size }}
    />
  )
}
