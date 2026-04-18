import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { CollectionCard, CollectionListParams } from '../../../shared/types'
import { ColorIdentity } from '@/components/ColorIdentity'
import { SetSymbol } from '@/components/SetSymbol'
import { CollectionImageGrid } from '@/components/CollectionImageGrid'
import { TableSkeleton, ImageGridSkeleton } from '@/components/skeletons'
import {
  ChevronUp,
  ChevronDown,
  Search,
  RotateCcw,
  LayoutGrid,
  List,
} from 'lucide-react'

const PAGE_SIZES = [25, 50, 100] as const
const MIN_NAME_SEARCH = 4
const MIN_SET_SEARCH = 2
const SEARCH_DEBOUNCE_MS = 500

type SortColumn = CollectionListParams['sortColumn']
type SortOrder = 'ASC' | 'DESC'
type ViewMode = 'table' | 'image'

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'card_name', label: 'Name' },
  { value: 'set_code', label: 'Set' },
  { value: 'collector_number', label: 'Quantity' },
  { value: 'quantity_nonfoil', label: 'Nonfoil' },
  { value: 'quantity_foil', label: 'Foil' },
  { value: 'total', label: 'Total' },
  { value: 'value', label: 'Value' },
]

export default function CollectionPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [sortColumn, setSortColumn] = useState<SortColumn>('card_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchSet, setSearchSet] = useState('')
  const [searchSetInput, setSearchSetInput] = useState('')
  const [view, setView] = useState<ViewMode>('table')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collection', page, pageSize, sortColumn, sortOrder, search, searchSet],
    queryFn: () =>
      window.api.collectionList({ page, pageSize, sortColumn, sortOrder, search, searchSet }),
  })

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0
  const startRow = data ? (page - 1) * pageSize + 1 : 0
  const endRow = data ? Math.min(page * pageSize, data.total) : 0

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.length >= MIN_NAME_SEARCH ? searchInput : ''
      if (next !== search) {
        setSearch(next)
        setPage(1)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput, search])

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchSetInput.length >= MIN_SET_SEARCH ? searchSetInput : ''
      if (next !== searchSet) {
        setSearchSet(next)
        setPage(1)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchSetInput, searchSet])

  const handleReset = useCallback(() => {
    setSearchInput('')
    setSearchSetInput('')
    setSearch('')
    setSearchSet('')
    setSortColumn('card_name')
    setSortOrder('ASC')
    setPage(1)
    setPageSize(25)
  }, [])

  const handleRowClick = useCallback(
    (card: CollectionCard) => {
      navigate(`/card-detail/${card.set_code}/${card.collector_number}`)
    },
    [navigate]
  )

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'card_name', label: 'Name', className: 'text-left' },
    { key: 'set_code', label: 'Set', className: 'w-14 text-center' },
    { key: 'collector_number', label: '#', className: 'w-16 text-right' },
    { key: 'color_identity', label: 'Colors', className: 'w-24 text-center' },
    { key: 'quantity_nonfoil', label: 'Nonfoil', className: 'w-16 text-right' },
    { key: 'quantity_foil', label: 'Foil', className: 'w-16 text-right' },
    { key: 'total', label: 'Total', className: 'w-16 text-right' },
    { key: 'value', label: '\u20AC', className: 'w-20 text-right' },
  ]

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Current collection</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} cards` : 'Loading...'}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <select
              value={sortColumn}
              onChange={(e) => {
                setSortColumn(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              title="Sort by"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
                setPage(1)
              }}
              title={`Sort ${sortOrder === 'ASC' ? 'ascending' : 'descending'}`}
              className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <span>{sortOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>
              {sortOrder === 'ASC' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Blisterpod`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-56 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`BFZ`}
              value={searchSetInput}
              onChange={(e) => setSearchSetInput(e.target.value.toUpperCase())}
              className="h-9 w-32 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring uppercase"
            />
          </div>
          <button
            onClick={handleReset}
            title="Reset filters and sort"
            className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex items-center rounded-md border border-input overflow-hidden">
            <button
              onClick={() => setView('table')}
              title="Table view"
              className={`h-9 px-2 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('image')}
              title="Image view"
              className={`h-9 px-2 ${view === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table / Grid */}
      {isLoading ? (
        view === 'table' ? <TableSkeleton /> : <ImageGridSkeleton />
      ) : isError ? (
        <div className="text-destructive p-4">
          Error loading collection: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : view === 'image' ? (
        <CollectionImageGrid cards={data?.rows ?? []} onCardClick={handleRowClick} />
      ) : (
        <div className="flex-1 overflow-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 font-medium text-muted-foreground ${col.className ?? ''}`}
                  >
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
                  <td className="px-3 py-1.5 truncate font-medium">
                    {card.card_name}
                  </td>
                  <td className="px-3 py-1.5 w-14 text-center">
                    <SetSymbol setCode={card.set_code} rarity={card.rarity} />
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">
                    {card.collector_number}
                  </td>
                  <td className="px-3 py-1.5 w-24 text-center">
                    <ColorIdentity value={card.color_identity} />
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">
                    {card.quantity_nonfoil}
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums">
                    {card.quantity_foil}
                  </td>
                  <td className="px-3 py-1.5 w-16 text-right tabular-nums font-medium">
                    {card.total}
                  </td>
                  <td className="px-3 py-1.5 w-20 text-right tabular-nums">
                    {card.value != null ? `${card.value.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`px-2 py-0.5 rounded ${pageSize === size ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
              >
                {size}
              </button>
            ))}
          </div>

          <span>
            {startRow}-{endRow} of {data.total.toLocaleString()}
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
