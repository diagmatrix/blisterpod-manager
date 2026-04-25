import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Pencil, Trash2, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react'
import { type CollectionCard, type CollectionListParams } from '../../../shared/types'
import { ColorIdentity } from '@/components/ColorIdentity'
import { SetSymbol } from '@/components/SetSymbol'
import { CollectionImageGrid } from '@/components/CollectionImageGrid'
import { TableSkeleton, ImageGridSkeleton } from '@/components/skeletons'
import { SectionHeader } from '@/components/SectionHeader'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { CardFilters, type CardFiltersState, type CardFiltersHandlers, type TokenFilter, type ColorMode } from '@/components/CardFilters'
import { Pagination } from '@/components/Pagination'
import { EditCardDialog } from '@/components/EditCardDialog'
import { DeleteCardDialog } from '@/components/DeleteCardDialog'
import { CardQuickDialog } from '@/components/CardQuickDialog'

const PAGE_SIZES = [30, 60, 120] as const
const MIN_SEARCH_SET_CODE = 2
const MIN_SEARCH_CARD_NAME = 3
const SEARCH_DEBOUNCE_MS = 500

type SortColumn = CollectionListParams['sortColumn']
type SortOrder = 'ASC' | 'DESC'

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'card_name', label: 'Name' },
  { value: 'set_code', label: 'Set' },
  { value: 'collector_number', label: 'Collector #' },
  { value: 'quantity_nonfoil', label: 'Nonfoil' },
  { value: 'quantity_foil', label: 'Foil' },
  { value: 'total', label: 'Total' },
  { value: 'value', label: 'Value' },
]

export default function CollectionPage() {
  const location = useLocation()
  const initialSet: string = location.state?.filterSet ?? ''

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [sortColumn, setSortColumn] = useState<SortColumn>('value')
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
  const [view, setView] = useState<ViewMode>('image')

  // Filter input state (uncommitted)
  const [searchInput, setSearchInput] = useState('')
  const [searchSetInput, setSearchSetInput] = useState(initialSet)
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('cards')
  const [raritiesInput, setRaritiesInput] = useState<string[]>([])
  const [colorsInput, setColorsInput] = useState<string[]>([])
  const [colorMode, setColorMode] = useState<ColorMode>('atLeast')

  // Committed filter state (sent to IPC)
  const [search, setSearch] = useState('')
  const [searchSet, setSearchSet] = useState(initialSet)
  const [rarities, setRarities] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])

  const [filterExpanded, setFilterExpanded] = useState(true)
  const [sortExpanded, setSortExpanded] = useState(true)

  // Dialog state
  const [quickCard, setQuickCard] = useState<CollectionCard | null>(null)
  const [editCard, setEditCard] = useState<CollectionCard | null>(null)
  const [deleteCard, setDeleteCard] = useState<CollectionCard | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collection', page, pageSize, sortColumn, sortOrder, search, searchSet, tokenFilter, rarities, colors, colorMode],
    queryFn: () =>
      window.api.collectionList({
        page, pageSize, sortColumn, sortOrder, search, searchSet, tokenFilter, rarities, colors, colorMode,
      }),
  })

  // Debounce name search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.length >= MIN_SEARCH_CARD_NAME ? searchInput : ''
      if (next !== search) { setSearch(next); setPage(1) }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput, search])

  // Debounce set search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchSetInput.length >= MIN_SEARCH_SET_CODE ? searchSetInput : ''
      if (next !== searchSet) { setSearchSet(next); setPage(1) }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchSetInput, searchSet])

  // Debounce rarities
  useEffect(() => {
    const t = setTimeout(() => { setRarities(raritiesInput); setPage(1) }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [raritiesInput])

  // Debounce colors
  useEffect(() => {
    const t = setTimeout(() => { setColors(colorsInput); setPage(1) }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [colorsInput])

  const handleReset = useCallback(() => {
    setSearchInput(''); setSearchSetInput(''); setSearch(''); setSearchSet('')
    setSortColumn('value'); setSortOrder('DESC')
    setPage(1); setPageSize(PAGE_SIZES[0])
    setTokenFilter('cards')
    setRaritiesInput([]); setRarities([])
    setColorsInput([]); setColors([])
    setColorMode('atLeast')
  }, [])

  const handleRowClick = useCallback((card: CollectionCard) => {
    setQuickCard(card)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize); setPage(1)
  }, [])

  const filtersState: CardFiltersState = {
    searchInput, searchSetInput, tokenFilter, raritiesInput, colorsInput, colorMode,
  }
  const filtersHandlers: CardFiltersHandlers = {
    setSearchInput,
    setSearchSetInput,
    setTokenFilter: (v) => { setTokenFilter(v); setPage(1) },
    toggleRarity: (r) => setRaritiesInput((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]),
    toggleColor: (c) => setColorsInput((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
    setColorMode: (m) => { setColorMode(m); setPage(1) },
  }

  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'card_name', label: 'Name', className: 'text-left' },
    { key: 'set_code', label: 'Set', className: 'w-14 text-center' },
    { key: 'collector_number', label: '#', className: 'w-16 text-right' },
    { key: 'color_identity', label: 'Colors', className: 'w-24 text-center' },
    { key: 'quantity_nonfoil', label: 'Nonfoil', className: 'w-16 text-right' },
    { key: 'quantity_foil', label: 'Foil', className: 'w-16 text-right' },
    { key: 'total', label: 'Total', className: 'w-16 text-right' },
    { key: 'value', label: '€', className: 'w-20 text-right' },
    { key: 'actions', label: '', className: 'w-16 text-right' },
  ]

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collection</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} cards` : 'Loading...'}
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
              {data?.rows.map((card, i) => (
                <tr
                  key={`${card.set_code}-${card.collector_number}-${i}`}
                  className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(card)}
                >
                  <td className="px-3 py-1.5 truncate font-medium">{card.card_name}</td>
                  <td className="px-3 py-1.5 w-14 text-center">
                    <SetSymbol setCode={card.base_set_code} setName={card.set_name} rarity={card.rarity} />
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.collector_number}</td>
                  <td className="px-3 py-1.5 w-24 text-center">
                    <ColorIdentity value={card.color_identity} />
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.quantity_nonfoil}</td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">{card.quantity_foil}</td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums font-medium">{card.total}</td>
                  <td className="px-3 py-1.5 w-20 text-right tabular-nums">
                    {card.value != null ? `${card.value.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Edit quantities"
                        onClick={() => setEditCard(card)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Remove from collection"
                        onClick={() => setDeleteCard(card)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      {editCard && (
        <EditCardDialog
          card={editCard}
          collectionId={editCard.collection_id}
          open={!!editCard}
          onOpenChange={(open) => { if (!open) setEditCard(null) }}
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
