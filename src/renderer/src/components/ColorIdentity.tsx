import { COLOR_SYMBOL_MAP, setStandardColorOrder } from '../../../shared/mana'

interface ColorIdentityProps {
  /** JSON array string from DB, e.g. '["W","U"]' */
  value: string | null
  size?: number
}

export function ColorIdentity({ value, size = 16 }: ColorIdentityProps) {
  if (!value) return <span className="text-muted-foreground text-xs">C</span>

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
        return (
          <img
            key={c}
            src={src}
            alt={c}
            width={size}
            height={size}
            className="inline-block"
          />
        )
      })}
    </span>
  )
}
