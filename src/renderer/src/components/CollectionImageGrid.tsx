import { useState } from 'react'
import type { CollectionCard } from '../../../shared/types'
import { SetSymbol } from './SetSymbol'

interface CollectionImageGridProps {
  cards: CollectionCard[]
  onCardClick: (card: CollectionCard) => void
}

export function CollectionImageGrid({ cards, onCardClick }: CollectionImageGridProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-md border border-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {cards.map((card, i) => (
          <ImageCell
            key={`${card.set_code}-${card.collector_number}-${i}`}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </div>
  )
}

interface ImageCellProps {
  card: CollectionCard
  onClick: () => void
}

function ImageCell({ card, onClick }: ImageCellProps) {
  const [errored, setErrored] = useState(false)
  const canShowImage = !errored && card.scryfall_id && card.image_url
  const imageSrc = canShowImage
    ? `card-image://${card.scryfall_id}?u=${encodeURIComponent(card.image_url!)}`
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="aspect-[488/680] w-full overflow-hidden rounded-md border border-border bg-muted relative">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={card.card_name}
            loading="lazy"
            onError={() => setErrored(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted-foreground">
            {card.card_name}
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-0.5 items-center justify-center w-full">
        <div className="flex items-center justify-center gap-1.5 w-full overflow-hidden">
          <SetSymbol setCode={card.set_code} rarity={card.rarity} size="1rem" />
          <span className="text-sm font-medium truncate min-w-0">{card.card_name}</span>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          Nonfoil {card.quantity_nonfoil} &middot; Foil {card.quantity_foil} &middot; Total{' '}
          <span className="font-medium text-foreground">{card.total}</span>
        </div>
        <div className="text-xs tabular-nums">
          {card.value != null ? `\u20AC${card.value.toFixed(2)}` : '-'}
        </div>
      </div>
    </button>
  )
}
