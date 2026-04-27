import { useState, useCallback } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Pencil, RotateCcw, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import type { CollectionCard } from '../../../shared/cards'
import type { CollectionListParams } from '../../../shared/search'
import { ManaSymbols } from '@/components/ManaSymbols'
import { SetSymbol } from '@/components/SetSymbol'
import { CollectionImageGrid } from '@/components/CollectionImageGrid'
import { TableSkeleton, ImageGridSkeleton } from '@/components/skeletons'
import { SectionHeader } from '@/components/SectionHeader'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { CardFilters } from '@/components/CardFilters'
import { Pagination } from '@/components/Pagination'
import { DeleteCardDialog } from '@/components/DeleteCardDialog'
import { CardQuickDialog } from '@/components/CardQuickDialog'
import { useCardFilters } from '@/hooks/useCardFilters'
import { Button } from '@/components/ui/button'

const PAGE_SIZES = [30, 60, 120] as const

type SortColumn = CollectionListParams['sortColumn']
type SortOrder = 'ASC' | 'DESC'

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'card_name', label: 'Name' },
  { value: 'set_code', label: 'Set' },
  { value: 'collector_number', label: 'Collector number' },
  { value: 'quantity_nonfoil', label: 'Nonfoil' },
  { value: 'quantity_foil', label: 'Foil' },
  { value: 'total', label: 'Total' },
  { value: 'value', label: 'Value' },
]

interface CollectionTableProps {
  cards: CollectionCard[],
  onRowClick?: (card: CollectionCard) => void,
  onDeleteClick?: (card: CollectionCard) => void,
}

function CollectionTable(props: CollectionTableProps) {
  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'card_name', label: 'Name', className: 'text-left' },
    { key: 'set_code', label: 'Set', className: 'w-14 text-center' },
    { key: 'collector_number', label: 'Collector Number', className: 'w-40 text-right' },
    { key: 'color_identity', label: 'Colors', className: 'w-24 text-center' },
    { key: 'quantity_nonfoil', label: 'Nonfoil', className: 'w-16 text-right' },
    { key: 'quantity_foil', label: 'Foil', className: 'w-16 text-right' },
    { key: 'total', label: 'Total', className: 'w-16 text-right' },
    { key: 'value', label: '€', className: 'w-20 text-right' },
    { key: 'actions', label: '', className: 'w-16 text-right' },
  ]

  return (
    <div className="flex-1 overflow-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 font-medium text-muted-foreground ${col.className ?? ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.cards.map((card, i) => (
            <tr
              key={`${card.set_code}-${card.collector_number}-${i}`}
              className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <td className="px-3 py-1.5 truncate font-medium">{card.name}</td>
              <td className="px-3 py-1.5 w-14 text-center">
                <SetSymbol setCode={card.base_set_code} setName={card.set_name} rarity={card.rarity} />
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
              <td className="px-3 py-1.5 w-16 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    title="Edit"
                    onClick={() => props.onRowClick?.(card)}
                    variant="outline"
                  >
                    <Pencil className="w-2 h-2" />
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
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CollectionPage() {
  const location = useLocation()
  const initialSet: string = location.state?.filterSet ?? ''

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [sortColumn, setSortColumn] = useState<SortColumn>('value')
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
  const [view, setView] = useState<ViewMode>('image')

  const [filterExpanded, setFilterExpanded] = useState(true)
  const [sortExpanded, setSortExpanded] = useState(true)

  const [quickCard, setQuickCard] = useState<CollectionCard | null>(null)
  const [deleteCard, setDeleteCard] = useState<CollectionCard | null>(null)

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
    setSortColumn('value'); setSortOrder('DESC')
    setPage(1); setPageSize(PAGE_SIZES[0])
  }, [resetFilters])

  const handleRowClick = useCallback((card: CollectionCard) => {
    setQuickCard(card)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize); setPage(1)
  }, [])

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
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortColumn === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value === sortColumn) setSortOrder((p) => p === 'ASC' ? 'DESC' : 'ASC')
                    else { setSortColumn(opt.value); setSortOrder('ASC') }
                    setPage(1)
                  }}
                  className={`h-8 px-3 rounded-md text-sm font-medium border transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              )
            })}
            <button
              onClick={() => { setSortOrder((p) => p === 'ASC' ? 'DESC' : 'ASC'); setPage(1) }}
              className="h-8 px-3 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <span>{sortOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>
              {sortOrder === 'ASC' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
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
        <CollectionTable cards={data?.rows ?? []} onRowClick={handleRowClick} onDeleteClick={setDeleteCard} />
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
    </div>
  )
}
