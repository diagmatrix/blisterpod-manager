import { useState } from 'react'
import { SetSymbol } from './SetSymbol'

interface CardImageCellProps {
  scryfall_id: string | null
  image_url: string | null
  name: string
  collector_number: string
  set_code: string
  base_set_code?: string
  set_name?: string | null
  rarity: string | null
  onBottomClick: () => void
  onTopClick?: () => void
  hoverLabel?: string
  quantity_nonfoil?: number
  quantity_foil?: number
  value_nonfoil?: number | null
  value_foil?: number | null
  value?: number | null
  isCollection: boolean
}

interface QuantitiesAndValuesProps {
  nonfoil: string | number
  foil: string | number
  total?: number | null
}

function QuantitiesAndValues({ nonfoil, foil, total }: QuantitiesAndValuesProps) {
  return (
    <div className="text-xs text-muted-foreground tabular-nums">
      Nonfoil {nonfoil} &middot; Foil {foil}
      {total != null && (
        <> &middot; Total <span className="font-medium text-foreground">{total}</span></>
      )}
    </div>
  )
}

export function CardImageCell(props: CardImageCellProps) {
  const [errored, setErrored] = useState(false)
  const [topHovered, setTopHovered] = useState(false)

  const imageSrc = !errored && props.scryfall_id && props.image_url ? `card-image://${props.scryfall_id}?u=${encodeURIComponent(props.image_url)}` : null
  const nonfoil = props.value_nonfoil != null ? `€${Number(props.value_nonfoil).toFixed(2)}` : props.quantity_nonfoil ?? 0
  const foil = props.value_foil != null ? `€${Number(props.value_foil).toFixed(2)}` : props.quantity_foil ?? 0

  return (
    <button
      type="button"
      onClick={props.onBottomClick}
      className="group flex flex-col gap-2 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className={`aspect-[488/680] w-full overflow-hidden rounded-md border bg-muted relative transition-shadow ${topHovered ? 'border-primary ring-2 ring-inset ring-primary' : 'border-border'}`}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={props.name}
            loading="lazy"
            onError={() => setErrored(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted-foreground">
            {props.name}
          </div>
        )}
        {props.onTopClick && (
          <div
            className="absolute top-0 left-0 right-0 h-1/2 group/top cursor-pointer"
            onMouseEnter={() => setTopHovered(true)}
            onMouseLeave={() => setTopHovered(false)}
            onClick={(e) => { e.stopPropagation(); props.onTopClick!() }}
          >
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/top:opacity-100 transition-opacity flex items-start justify-center pt-2">
              <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Add foil to batch
              </span>
            </div>
          </div>
        )}
        {props.hoverLabel && (
          <div className="absolute bottom-0 left-0 right-0 h-1/2 group/bottom">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/bottom:opacity-100 transition-opacity flex items-end justify-center pb-2">
              <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded">
                {props.hoverLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-0.5 items-center justify-center w-full">
        <div className="flex items-center justify-center gap-1.5 w-full overflow-hidden">
          <SetSymbol setCode={props.base_set_code ?? props.set_code} setName={props.set_name} rarity={props.rarity} size="1rem" />
          <span className="text-xs text-muted-foreground shrink-0">#{props.collector_number}</span>
          <span className="text-sm font-medium truncate min-w-0">{props.name}</span>
        </div>
        <QuantitiesAndValues
          nonfoil={nonfoil}
          foil={foil}
          total={props.isCollection ? (props.quantity_nonfoil ?? 0) + (props.quantity_foil ?? 0) : null}
        />
        {props.value != null && (
          <span className="text-sm font-medium truncate min-w-0">{Number(props.value).toFixed(2)}€</span>
        )}
      </div>
    </button>
  )
}
