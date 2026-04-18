import { useState } from 'react'
import { SetSymbol } from './SetSymbol'

interface CardImageCellProps {
  scryfall_id: string | null
  image_url: string | null
  name: string
  set_code: string
  rarity: string | null
  onClick: () => void
  hoverLabel?: string
  quantity_nonfoil?: number
  quantity_foil?: number
  value_nonfoil?: number | null
  value_foil?: number | null
}

export function CardImageCell({
  scryfall_id,
  image_url,
  name,
  set_code,
  rarity,
  onClick,
  hoverLabel,
  quantity_nonfoil,
  quantity_foil,
  value_nonfoil,
  value_foil,
}: CardImageCellProps) {
  const [errored, setErrored] = useState(false)
  const src = !errored && scryfall_id && image_url
    ? `card-image://${scryfall_id}?u=${encodeURIComponent(image_url)}`
    : null

  const hasValue = value_nonfoil != null || value_foil != null
  const hasQty = quantity_nonfoil != null || quantity_foil != null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="aspect-[488/680] w-full overflow-hidden rounded-md border border-border bg-muted relative">
        {src ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setErrored(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted-foreground">
            {name}
          </div>
        )}
        {hoverLabel && (
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
            <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded">
              {hoverLabel}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-0.5 items-center justify-center w-full">
        <div className="flex items-center justify-center gap-1.5 w-full overflow-hidden">
          <SetSymbol setCode={set_code} rarity={rarity} size="1rem" />
          <span className="text-sm font-medium truncate min-w-0">{name}</span>
        </div>
        {hasValue ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            Nonfoil {value_nonfoil != null ? `€${value_nonfoil.toFixed(2)}` : '-'}
            &nbsp;&nbsp;
            Foil {value_foil != null ? `€${value_foil.toFixed(2)}` : '-'}
          </div>
        ) : hasQty ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            Nonfoil {quantity_nonfoil ?? 0} &middot; Foil {quantity_foil ?? 0} &middot; Total{' '}
            <span className="font-medium text-foreground">{(quantity_nonfoil ?? 0) + (quantity_foil ?? 0)}</span>
          </div>
        ) : null}
      </div>
    </button>
  )
}
