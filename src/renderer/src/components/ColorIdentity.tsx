import wSvg from '../../../../resources/mana-symbols/W.svg'
import uSvg from '../../../../resources/mana-symbols/U.svg'
import bSvg from '../../../../resources/mana-symbols/B.svg'
import rSvg from '../../../../resources/mana-symbols/R.svg'
import gSvg from '../../../../resources/mana-symbols/G.svg'
import cSvg from '../../../../resources/mana-symbols/C.svg'

const WUBRG_ORDER: string[] = ['W', 'U', 'B', 'R', 'G']

const SYMBOL_MAP: Record<string, string> = {
  W: wSvg,
  U: uSvg,
  B: bSvg,
  R: rSvg,
  G: gSvg,
  C: cSvg,
}

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
    colors = raw.sort((a, b) => WUBRG_ORDER.indexOf(a) - WUBRG_ORDER.indexOf(b))
  } catch {
    return null
  }

  if (colors.length === 0) {
    return <img src={SYMBOL_MAP['C']} alt="C" width={size} height={size} className="inline-block" />
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {colors.map((c) => {
        const src = SYMBOL_MAP[c]
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
