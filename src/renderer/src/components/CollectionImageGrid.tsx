import type { CollectionCard } from '../../../shared/cards'
import { CardImageCell } from './CardImageCell'

interface CollectionImageGridProps {
  cards: CollectionCard[]
  onCardClick: (card: CollectionCard) => void
}

export function CollectionImageGrid({ cards, onCardClick }: CollectionImageGridProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-md border border-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {cards.map((card, i) => (
          <CardImageCell
            key={`${card.set_code}-${card.collector_number}-${i}`}
            scryfall_id={card.scryfall_id}
            image_url={card.image_url}
            name={card.name ?? `${card.set_code.toUpperCase()} #${card.collector_number}`}
            collector_number={card.collector_number}
            set_code={card.base_set_code}
            set_name={card.set_name}
            rarity={card.rarity}
            onBottomClick={() => onCardClick(card)}
            quantity_nonfoil={card.quantity_nonfoil}
            quantity_foil={card.quantity_foil}
            value={card.value}
            isCollection={true}
          />
        ))}
      </div>
    </div>
  )
}
