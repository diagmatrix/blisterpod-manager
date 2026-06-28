import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { ScryfallCard } from '../../../shared/cards'
import type { BatchItem, CardSearchParams } from '../../../shared/search'
import { CardFilters } from '@/components/CardFilters'
import { useCardFilters } from '@/hooks/useCardFilters'
import { useCardSort } from '@/hooks/useCardSort'
import { CardSort } from '@/components/CardSort'
import { ViewToggle } from '@/components/ViewToggle'
import { SectionHeader } from '@/components/SectionHeader'
import { BatchPanel } from '@/components/BatchPanel'
import { CardImageCell } from '@/components/CardImageCell'
import { useCardImagePreview } from '@/components/CardImagePreview'
import { SetSymbol } from '@/components/SetSymbol'
import { ManaSymbols } from '@/components/ManaSymbols'
import { Pagination } from '@/components/Pagination'
import { useCardSearch } from '@/hooks/useCardSearch'
import { ImageGridSkeleton, TableSkeleton } from '@/components/skeletons'
import { PAGE_SIZES } from '@/hooks/useDefaultPageSize'
import { usePagination } from '@/hooks/usePagination'
import { usePageViewState } from '@/hooks/usePageViewState'

const SORT_OPTIONS = [
  { value: 'rarity', label: 'Rarity' },
  { value: 'released_at', label: 'Release date' },
]

interface CardTableProps {
  cards: ScryfallCard[]
  onAddNonfoil: (card: ScryfallCard) => void
  onAddFoil: (card: ScryfallCard) => void
}

/** Which half of a row the cursor is over (left = nonfoil, right = foil). */
function sideFromEvent(e: React.MouseEvent): 'left' | 'right' {
  const rect = e.currentTarget.getBoundingClientRect()
  return e.clientX - rect.left < rect.width / 2 ? 'left' : 'right'
}

function CardTable(props: CardTableProps) {
  const { bind, element } = useCardImagePreview()
  const [hover, setHover] = useState<{ index: number; side: 'left' | 'right' } | null>(null)
  return (
    <>
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-14 text-center">Set</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-40 text-right">Collector Number</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-24 text-center">Colors</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-34">Price (€)</th>
          </tr>
        </thead>
        <tbody>
          {props.cards.map((card, i) => {
            const src = card.scryfall_id && card.image_url
              ? `card-image://${card.scryfall_id}?u=${encodeURIComponent(card.image_url)}`
              : null
            const bound = bind(src)
            const isHovered = hover?.index === i
            return (
              <tr
                key={`${card.set_code}-${card.collector_number}-${i}`}
                className="relative border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                onMouseEnter={bound.onMouseEnter}
                onMouseMove={(e) => {
                  bound.onMouseMove(e)
                  const side = sideFromEvent(e)
                  setHover((prev) => (prev && prev.index === i && prev.side === side ? prev : { index: i, side }))
                }}
                onMouseLeave={() => {
                  bound.onMouseLeave()
                  setHover((prev) => (prev?.index === i ? null : prev))
                }}
                onClick={(e) => (sideFromEvent(e) === 'left' ? props.onAddNonfoil(card) : props.onAddFoil(card))}
              >
                <td className="px-3 py-1.5 font-medium truncate max-w-0">
                  {card.name}
                  {isHovered && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex">
                      <div className={`flex-1 flex items-center justify-start pl-3 transition-colors ${hover.side === 'left' ? 'bg-primary/10' : ''}`}>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${hover.side === 'left' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>+ Nonfoil</span>
                      </div>
                      <div className={`flex-1 flex items-center justify-end pr-3 transition-colors ${hover.side === 'right' ? 'bg-primary/10' : ''}`}>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${hover.side === 'right' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>+ Foil</span>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-3 py-1.5 w-16 text-center">
                  <SetSymbol setCode={card.set_code} setName={card.set_name} rarity={card.rarity} collectorNumber={card.collector_number} />
                </td>
                <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.collector_number}</td>
                <td className="px-3 py-1.5 w-24 text-center">
                  <ManaSymbols value={card.color_identity} />
                </td>
                <td className="px-3 py-1.5 w-20 text-xs text-muted-foreground">{card.value_nonfoil}/{card.value_foil}€</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    {element}
    </>
  )
}

export default function AddCardPage() {
  /** Page rendering */
  const { view, setView, isFilterExpanded, toggleFilter, isSortExpanded, toggleSort } = usePageViewState()
  const { page, setPage, pageSize, handlePageSizeChange } = usePagination()

  /** Sorting */
  const { sortColumn, sortOrder, handleSort, toggleOrder } = useCardSort({ defaultColumn: 'collector_number', defaultOrder: 'ASC' })

  /** Filtering */
  const onFilterCommit = useCallback(() => setPage(1), [setPage])
  const { filtersState, filtersHandlers, search, searchSet, tokenFilter, rarities, colors, colorMode } = useCardFilters({ isFilteringCollection: false, onCommit: onFilterCommit })

  /** Card retrieval */
  const queryClient = useQueryClient()
  const searchParams: CardSearchParams = {


    query: search || undefined,
    set_code: searchSet || undefined,
    rarities: rarities.length > 0 ? rarities : undefined,
    colors: colors.length > 0 ? colors : undefined,
    colorMode: colors.length > 0 ? colorMode : undefined,
    tokenFilter: tokenFilter || 'all',
    sortColumn,
    sortOrder,
    page,
    pageSize,
  }
  const hasFilter = !!(searchParams.query || searchParams.set_code)
  const { rows, total, isLoading } = useCardSearch(searchParams)

  /** Batch */
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [isAdding, setIsAdding] = useState(false)

  const addToBatch = useCallback((card: ScryfallCard) => {
    setBatch((prev) => {
      const idx = prev.findIndex(
        (b) => b.card.set_code === card.set_code && b.card.collector_number === card.collector_number
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity_nonfoil: next[idx].quantity_nonfoil + 1 }
        return next
      }
      return [...prev, { card, quantity_nonfoil: 1, quantity_foil: 0 }]
    })
  }, [])

  const addFoilToBatch = useCallback((card: ScryfallCard) => {
    setBatch((prev) => {
      const idx = prev.findIndex(
        (b) => b.card.set_code === card.set_code && b.card.collector_number === card.collector_number
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity_foil: next[idx].quantity_foil + 1 }
        return next
      }
      return [...prev, { card, quantity_nonfoil: 0, quantity_foil: 1 }]
    })
  }, [])

  const handleUpdate = useCallback((index: number, nonfoil: number, foil: number) => {
    setBatch((prev) => prev.map((item, i) => i === index ? { ...item, quantity_nonfoil: nonfoil, quantity_foil: foil } : item))
  }, [])

  const handleRemove = useCallback((index: number) => {
    setBatch((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddAll = useCallback(async () => {
    if (batch.length === 0) return
    setIsAdding(true)
    const items = batch.map((b) => ({
      set_code: b.card.set_code,
      collector_number: b.card.collector_number,
      quantity_nonfoil: b.quantity_nonfoil,
      quantity_foil: b.quantity_foil,
    }))
    const result = await window.api.collectionAddBatch(items)
    setIsAdding(false)

    if (result.inserted > 0) {
      toast.success('Cards added to collection')
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      setBatch([])
    }
    result.errors.forEach(({ message }) => toast.error(message))
  }, [batch, queryClient])

  return (
    <div className="flex p-3 gap-3 items-start">
      {/* Left: search panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add Cards</h1>
            <p className="text-sm text-muted-foreground">
              {hasFilter
                ? (isLoading ? 'Searching…' : `${total.toLocaleString()} result${total === 1 ? '' : 's'}`)
                : 'Search to find cards'}
            </p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
          <SectionHeader label="Filter by" expanded={isFilterExpanded} onToggle={toggleFilter} />
          {isFilterExpanded && <CardFilters state={filtersState} handlers={filtersHandlers} showTokenFilter={true} />}
        </div>

        <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
          <SectionHeader label="Sort by" expanded={isSortExpanded} onToggle={toggleSort} />
          {isSortExpanded && (
            <CardSort
              options={SORT_OPTIONS}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={(col) => { handleSort(col); setPage(1) }}
              onToggleOrder={() => { toggleOrder(); setPage(1) }}
            />
          )}
        </div>

        {isLoading ? (
          view === 'image' ? <ImageGridSkeleton /> : <TableSkeleton />
        ) : !hasFilter ? (
          <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
            Enter a name or set code to search the local card catalog
          </div>
        ) : rows.length === 0 ? (
          <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
            No cards found in local catalog
          </div>
        ) : view === 'image' ? (
          <div className="overflow-x-hidden rounded-md border border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {rows.map((card, i) => (
                <CardImageCell
                  key={`${card.set_code}-${card.collector_number}-${i}`}
                  scryfall_id={card.scryfall_id}
                  image_url={card.image_url}
                  name={card.name ?? `${card.set_code.toUpperCase()} #${card.collector_number}`}
                  collector_number={card.collector_number}
                  set_code={card.set_code}
                  base_set_code={card.base_set_code}
                  set_name={card.set_name}
                  rarity={card.rarity}
                  value_nonfoil={card.value_nonfoil}
                  value_foil={card.value_foil}
                  onBottomClick={() => addToBatch(card)}
                  onTopClick={() => addFoilToBatch(card)}
                  hoverLabel="Add to batch"
                  isCollection={false}
                />
              ))}
            </div>
          </div>
        ) : (
          <CardTable
            cards={rows}
            onAddNonfoil={addToBatch}
            onAddFoil={addFoilToBatch}
          />
        )}

        {hasFilter && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Right: batch panel */}
      <BatchPanel
        items={batch}
        onAddCard={(item) => setBatch((prev) => [...prev, item])}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        onDiscard={() => setBatch([])}
        onAddAll={handleAddAll}
        isAdding={isAdding}
      />
    </div>
  )
}
