interface SetSymbolProps {
  setCode: string
  setName?: string | null
  rarity?: string | null
  size?: string
}

export function SetSymbol({ setCode, setName, rarity, size = '1.2rem' }: SetSymbolProps) {
  if (!setCode) return null
  const rarityClass = rarity ? `ss-${rarity}` : ''

  return (
    <i
      className={`ss ss-${setCode.toLowerCase()} ${rarityClass} ss-grad ss-fw`}
      title={setName ?? setCode.toUpperCase()}
      style={{ fontSize: size }}
    />
  )
}
