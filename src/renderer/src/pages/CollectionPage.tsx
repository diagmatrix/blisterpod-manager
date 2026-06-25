import { useState, useEffect, useCallback } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import type { CollectionCard } from '../../../shared/cards'
import { ManaSymbols } from '@/components/ManaSymbols'
import { SetSymbol } from '@/components/SetSymbol'
import { CollectionImageGrid } from '@/components/CollectionImageGrid'
import { TableSkeleton, ImageGridSkeleton } from '@/components/skeletons'
import { SectionHeader } from '@/components/SectionHeader'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { CardFilters } from '@/components/CardFilters'
import { Pagination } from '@/components/Pagination'
import { DeleteCardDialog } from '@/components/DeleteCardDialog'
import { DeleteSelectedCardsDialog } from '@/components/DeleteSelectedCardsDialog'
import { CardQuickDialog } from '@/components/CardQuickDialog'
import { useCardFilters } from '@/hooks/useCardFilters'
import { useCardSort } from '@/hooks/useCardSort'
import { CardSort } from '@/components/CardSort'
import { Button } from '@/components/ui/button'
import { PAGE_SIZES, FALLBACK_PAGE_SIZE, useDefaultPageSize } from '@/hooks/useDefaultPageSize'

const SORT_OPTIONS = [
  { value: 'total', label: 'Total' },
  { value: 'value', label: 'Value' },
]

interface CollectionTableProps {
  cards: CollectionCard[]
  selectedIds: Set<number>
  onToggleSelect: (id: number) => void
  onToggleSelectAll: (selected: boolean) => void
  onRowClick?: (card: CollectionCard) => void
  onDeleteClick?: (card: CollectionCard) => void
}

function CollectionTable(props: CollectionTableProps) {
  const { cards, selectedIds, onToggleSelect, onToggleSelectAll } = props
  const allSelected = cards.length > 0 && cards.every((c) => selectedIds.has(c.collection_id))
  const someSelected = !allSelected && cards.some((c) => selectedIds.has(c.collection_id))

  return (
    <div className="flex-1 overflow-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
          <tr className="border-b border-border">
            <th className="px-3 py-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                className="cursor-pointer"
              />
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-14 text-center">Set</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-40 text-right">Collector Number</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-24 text-center">Colors</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-16 text-right">Nonfoil</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-16 text-right">Foil</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-16 text-right">Total</th>
            <th className="px-3 py-2 font-medium text-muted-foreground w-20 text-right">€</th>
            <th className="px-3 py-2 w-16" />
          </tr>
        </thead>
        <tbody>
          {cards.map((card, i) => {
            const isSelected = selectedIds.has(card.collection_id)
            return (
              <tr
                key={`${card.set_code}-${card.collector_number}-${i}`}
                className={`border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? 'bg-muted/40' : ''}`}
                onClick={() => onToggleSelect(card.collection_id)}
              >
                <td className="px-3 py-1.5 w-8" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(card.collection_id)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-3 py-1.5 truncate font-medium">{card.name}</td>
                <td className="px-3 py-1.5 w-14 text-center">
                  <SetSymbol setCode={card.base_set_code} setName={card.set_name} rarity={card.rarity} collectorNumber={card.collector_number} />
                </td>
                <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.collector_number}</td>
                <td className="px-3 py-1.5 w-24 text-center">
                  <ManaSymbols value={card.color_identity} />
                </td>
                <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.quantity_nonfoil}</td>
                <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.quantity_foil}</td>
                <td className="px-3 py-1.5 w-16 text-right tabular-nums font-medium">{card.total}</td>
                <td className="px-3 py-1.5 w-20 text-right tabular-nums">
                  {card.value != null ? `${card.value.toFixed(2)}€` : '-€'}
                </td>
                <td className="px-3 py-1.5 w-16 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      title="View"
                      onClick={() => props.onRowClick?.(card)}
                      variant="outline"
                    >
                      <Eye className="w-2 h-2" />
                    </Button>
                    <Button
                      title="Delete"
                      onClick={() => props.onDeleteClick?.(card)}
                      variant="destructive"
                    >
                      <Trash2 className="w-2 h-2" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function CollectionPage() {
  const location = useLocation()
  const initialSet: string = location.state?.filterSet ?? ''

  const [page, setPage] = useState(1)
  const defaultPageSize = useDefaultPageSize()
  const [pageSize, setPageSize] = useState<number>(FALLBACK_PAGE_SIZE)
  const { sortColumn, sortOrder, handleSort, toggleOrder, reset: resetSort } = useCardSort({ defaultColumn: 'value', defaultOrder: 'DESC' })

  useEffect(() => { setPageSize(defaultPageSize) }, [defaultPageSize])
  const [view, setView] = useState<ViewMode>('image')

  const [filterExpanded, setFilterExpanded] = useState(true)
  const [sortExpanded, setSortExpanded] = useState(true)

  const [quickCard, setQuickCard] = useState<CollectionCard | null>(null)
  const [deleteCard, setDeleteCard] = useState<CollectionCard | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false)

  const onFilterCommit = useCallback(() => setPage(1), [])

  const {
    filtersState, filtersHandlers,
    search, searchSet, tokenFilter, rarities, colors, colorMode,
    reset: resetFilters,
  } = useCardFilters({ initialSet, onCommit: onFilterCommit })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collection', page, pageSize, sortColumn, sortOrder, search, searchSet, tokenFilter, rarities, colors, colorMode],
    queryFn: () =>
      window.api.collectionList({
        page, pageSize, sortColumn, sortOrder, search, searchSet, tokenFilter, rarities, colors, colorMode,
      }),
    placeholderData: keepPreviousData,
  })

  const handleReset = useCallback(() => {
    resetFilters()
    resetSort()
    setPage(1); setPageSize(defaultPageSize)
  }, [resetFilters, resetSort, defaultPageSize])

  const handleRowClick = useCallback((card: CollectionCard) => {
    setQuickCard(card)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize); setPage(1)
  }, [])

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const handleToggleSelectAll = useCallback((selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const pageIds = data?.rows.map((c) => c.collection_id) ?? []
      if (selected) pageIds.forEach((id) => next.add(id))
      else pageIds.forEach((id) => next.delete(id))
      return next
    })
  }, [data?.rows])

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collection</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} printings` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset filters and sort"
            className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Filter section */}
      <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
        <SectionHeader label="Filter by" expanded={filterExpanded} onToggle={() => setFilterExpanded((v) => !v)} />
        {filterExpanded && <CardFilters state={filtersState} handlers={filtersHandlers} showTokenFilter />}
      </div>

      {/* Sort section */}
      <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
        <SectionHeader label="Sort by" expanded={sortExpanded} onToggle={() => setSortExpanded((v) => !v)} />
        {sortExpanded && (
          <CardSort
            options={SORT_OPTIONS}
            sortColumn={sortColumn as string}
            sortOrder={sortOrder}
            onSort={(col) => { handleSort(col); setPage(1) }}
            onToggleOrder={() => { toggleOrder(); setPage(1) }}
          />
        )}
      </div>

      {/* Table / Grid */}
      {isLoading ? (
        view === 'table' ? <TableSkeleton /> : <ImageGridSkeleton />
      ) : isError ? (
        <div className="text-destructive p-4">
          Error loading collection: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : view === 'table' ? (
        <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Button size="sm" variant="destructive" onClick={() => setDeleteSelectedOpen(true)}>
                <Trash2 className="w-3 h-3" /> Remove selected
              </Button>
            </div>
          )}
          <CollectionTable
            cards={data?.rows ?? []}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onRowClick={handleRowClick}
            onDeleteClick={setDeleteCard}
          />
        </>
      ) : (
        <CollectionImageGrid cards={data?.rows ?? []} onCardClick={handleRowClick} />
      )}

      {/* Pagination */}
      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          pageSizes={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Dialogs */}
      {quickCard && (
        <CardQuickDialog
          card={quickCard}
          open={!!quickCard}
          onOpenChange={(open) => { if (!open) setQuickCard(null) }}
        />
      )}
      {deleteCard && (
        <DeleteCardDialog
          card={deleteCard}
          collectionId={deleteCard.collection_id}
          open={!!deleteCard}
          onOpenChange={(open) => { if (!open) setDeleteCard(null) }}
        />
      )}
      <DeleteSelectedCardsDialog
        ids={[...selectedIds]}
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  )
}
