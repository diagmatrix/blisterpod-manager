import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { ScryfallCard } from '../../../shared/cards'
import type { BatchItem, CardSearchParams } from '../../../shared/search'
import { CardFilters } from '@/components/CardFilters'
import { useCardFilters } from '@/hooks/useCardFilters'
import { useCardSort } from '@/hooks/useCardSort'
import { CardSort } from '@/components/CardSort'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { SectionHeader } from '@/components/SectionHeader'
import { BatchPanel } from '@/components/BatchPanel'
import { CardImageCell } from '@/components/CardImageCell'
import { SetSymbol } from '@/components/SetSymbol'
import { ManaSymbols } from '@/components/ManaSymbols'
import { Pagination } from '@/components/Pagination'
import { useCardSearch } from '@/hooks/useCardSearch'
import { ImageGridSkeleton, TableSkeleton } from '@/components/skeletons'

const PAGE_SIZES = [30, 60, 120] as const

const SORT_OPTIONS = [
  { value: 'rarity', label: 'Rarity' },
  { value: 'released_at', label: 'Release date' },
]

export default function AddCardPage() {
  const queryClient = useQueryClient()

  const [view, setView] = useState<ViewMode>('image')
  const [filterExpanded, setFilterExpanded] = useState(true)
  const [sortExpanded, setSortExpanded] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [isAdding, setIsAdding] = useState(false)

  const onFilterCommit = useCallback(() => setPage(1), [])
  const { filtersState, filtersHandlers } = useCardFilters({ onCommit: onFilterCommit })
  const { sortColumn, sortOrder, handleSort, toggleOrder } = useCardSort({ defaultColumn: 'collector_number', defaultOrder: 'ASC' })
  const { searchInput, searchSetInput, raritiesInput, colorsInput, colorMode } = filtersState

  const searchParams: CardSearchParams = {
    query: searchInput.length >= 2 ? searchInput : undefined,
    set_code: searchSetInput.length >= 2 ? searchSetInput : undefined,
    rarities: raritiesInput.length > 0 ? raritiesInput : undefined,
    colors: colorsInput.length > 0 ? colorsInput : undefined,
    colorMode: colorsInput.length > 0 ? colorMode : undefined,
    sortColumn,
    sortOrder,
    page,
    pageSize,
  }

  const { rows, total, isLoading } = useCardSearch(searchParams)

  const hasFilter = !!(searchParams.query || searchParams.set_code || searchParams.rarities?.length || searchParams.colors?.length)

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
      toast.success(`${result.inserted} card${result.inserted === 1 ? '' : 's'} added to collection`)
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      setBatch([])
    }
    result.errors.forEach(({ message }) => toast.error(message))
  }, [batch, queryClient])

  return (
    <div className="flex h-full p-3 gap-3 overflow-hidden">
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
          <SectionHeader label="Filter by" expanded={filterExpanded} onToggle={() => setFilterExpanded((v) => !v)} />
          {filterExpanded && <CardFilters state={filtersState} handlers={filtersHandlers} showTokenFilter={false} />}
        </div>

        <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
          <SectionHeader label="Sort by" expanded={sortExpanded} onToggle={() => setSortExpanded((v) => !v)} />
          {sortExpanded && (
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
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Enter a name or set code to search the local card catalog
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No cards found in local catalog
          </div>
        ) : view === 'image' ? (
          <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-md border border-border">
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
          <div className="flex-1 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-14">Img</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground w-16">Set</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground w-16">#</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Colors</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-20">Rarity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((card, i) => {
                  const src = card.scryfall_id && card.image_url
                    ? `card-image://${card.scryfall_id}?u=${encodeURIComponent(card.image_url)}`
                    : null
                  return (
                    <tr
                      key={`${card.set_code}-${card.collector_number}-${i}`}
                      className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => addToBatch(card)}
                    >
                      <td className="px-3 py-1.5 w-14">
                        {src && <img src={src} alt="" className="w-8 h-auto rounded" loading="lazy" />}
                      </td>
                      <td className="px-3 py-1.5 font-medium truncate max-w-0">{card.name}</td>
                      <td className="px-3 py-1.5 w-16 text-center">
                        <SetSymbol setCode={card.set_code} setName={card.set_name} rarity={card.rarity} collectorNumber={card.collector_number} />
                      </td>
                      <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.collector_number}</td>
                      <td className="px-3 py-1.5 w-24 text-center">
                        <ManaSymbols value={card.color_identity} />
                      </td>
                      <td className="px-3 py-1.5 w-20 text-xs text-muted-foreground capitalize">{card.rarity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasFilter && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
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
