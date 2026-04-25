import { COLOR_SYMBOL_MAP, getManaSymbolUrl, setStandardColorOrder } from '../../../shared/mana'

interface ColorIdentityProps {
  value: string | null
  isManaCost?: boolean
  size?: number
}

export function ManaSymbols({ value, size = 16, isManaCost = false }: ColorIdentityProps) {
  if (!value) return <span className="text-muted-foreground text-xs">C</span>

  if (isManaCost) {
    const symbols = (value.match(/\{([^}]+)\}/g) ?? []).map(m => m.slice(1, -1).toUpperCase())
    if (symbols.length === 0) return null
    return (
      <span className="inline-flex items-center gap-0.5">
        {symbols.map((c, i) => (
          <img key={i} src={getManaSymbolUrl(c)} alt={c} width={size} height={size} className="inline-block" />
        ))}
      </span>
    )
  }

  let colors: string[]
  try {
    const raw: string[] = JSON.parse(value)
    colors = setStandardColorOrder(raw, false)
  } catch {
    return null
  }

  if (colors.length === 0) {
    return <img src={COLOR_SYMBOL_MAP['C']} alt="C" width={size} height={size} className="inline-block" />
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {colors.map((c) => {
        const src = COLOR_SYMBOL_MAP[c]
        if (!src) return null
        return <img key={c} src={src} alt={c} width={size} height={size} className="inline-block" />
      })}
    </span>
  )
}
