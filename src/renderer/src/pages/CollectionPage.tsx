import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { type CollectionCard, type CollectionListParams, COLOR_SYMBOL_MAP } from '../../../shared/types'
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

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C']
const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
  special: 'Special',
  bonus: 'Bonus',
}

const PAGE_SIZES = [30, 60, 120] as const
const MIN_NAME_SEARCH = 4
const MIN_SET_SEARCH = 2
const SEARCH_DEBOUNCE_MS = 500

type SortColumn = CollectionListParams['sortColumn']
type SortOrder = 'ASC' | 'DESC'
type ViewMode = 'table' | 'image'
type TokenFilter = 'all' | 'cards' | 'tokens'
type ColorMode = 'including' | 'atLeast' | 'exactly'

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'card_name', label: 'Name' },
  { value: 'set_code', label: 'Set' },
  { value: 'collector_number', label: 'Quantity' },
  { value: 'quantity_nonfoil', label: 'Nonfoil' },
  { value: 'quantity_foil', label: 'Foil' },
  { value: 'total', label: 'Total' },
  { value: 'value', label: 'Value' },
]

function SectionHeader({
  label,
  expanded,
  onToggle,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full text-left"
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      {expanded ? (
        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  )
}

export default function CollectionPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [sortColumn, setSortColumn] = useState<SortColumn>('value')
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchSet, setSearchSet] = useState('')
  const [searchSetInput, setSearchSetInput] = useState('')
  const [view, setView] = useState<ViewMode>('image')

  // New filter state
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('cards')
  const [raritiesInput, setRaritiesInput] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  const [colorsInput, setColorsInput] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [colorMode, setColorMode] = useState<ColorMode>('including')

  // Section collapse state
  const [filterExpanded, setFilterExpanded] = useState(true)
  const [sortExpanded, setSortExpanded] = useState(true)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['collection', page, pageSize, sortColumn, sortOrder, search, searchSet, tokenFilter, rarities, colors, colorMode],
    queryFn: () =>
      window.api.collectionList({
        page,
        pageSize,
        sortColumn,
        sortOrder,
        search,
        searchSet,
        tokenFilter,
        rarities,
        colors,
        colorMode,
      }),
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

  useEffect(() => {
    const t = setTimeout(() => {
      setRarities(raritiesInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [raritiesInput])

  useEffect(() => {
    const t = setTimeout(() => {
      setColors(colorsInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [colorsInput])

  const handleReset = useCallback(() => {
    setSearchInput('')
    setSearchSetInput('')
    setSearch('')
    setSearchSet('')
    setSortColumn('value')
    setSortOrder('DESC')
    setPage(1)
    setPageSize(PAGE_SIZES[0])
    setTokenFilter('cards')
    setRaritiesInput([])
    setRarities([])
    setColorsInput([])
    setColors([])
    setColorMode('including')
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

  const toggleRarity = (r: string) => {
    setRaritiesInput((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )
  }

  const toggleColor = (c: string) => {
    setColorsInput((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const handleSortColumnClick = (col: string) => {
    if (col === sortColumn) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setSortColumn(col)
      setSortOrder('ASC')
    }
    setPage(1)
  }

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
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Top header row */}
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
          {/* View selector */}
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

      {/* Filter by section */}
      <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
        <SectionHeader
          label="Filter by"
          expanded={filterExpanded}
          onToggle={() => setFilterExpanded((v) => !v)}
        />
        {filterExpanded && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Name search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Name (min 4)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-48 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {/* Set search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Set (min 2)…"
                value={searchSetInput}
                onChange={(e) => setSearchSetInput(e.target.value.toUpperCase())}
                className="h-9 w-32 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring uppercase"
              />
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border mx-1" />

            {/* Token segmented control */}
            <div className="flex items-center rounded-md border border-input overflow-hidden">
              {(['all', 'cards', 'tokens'] as TokenFilter[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setTokenFilter(opt); setPage(1) }}
                  className={`h-9 px-3 text-sm capitalize ${tokenFilter === opt ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-border mx-1" />

            {/* Rarity pills */}
            {RARITY_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleRarity(r)}
                className={`h-8 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                  raritiesInput.includes(r)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {RARITY_LABELS[r]}
              </button>
            ))}

            {/* Separator */}
            <div className="h-6 w-px bg-border mx-1" />

            {/* Color toggles */}
            {COLOR_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => toggleColor(c)}
                title={c}
                className={`w-8 h-8 rounded-md border flex items-center justify-center transition-all ${
                  colorsInput.includes(c)
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-input opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                <img src={COLOR_SYMBOL_MAP[c]} alt={c} width={20} height={20} />
              </button>
            ))}

            {/* Color mode pills */}
            <div className="flex items-center rounded-md border border-input overflow-hidden">
              {(['including', 'atLeast', 'exactly'] as ColorMode[]).map((mode) => {
                const labels: Record<ColorMode, string> = {
                  including: 'Including',
                  atLeast: 'At least',
                  exactly: 'Exactly',
                }
                return (
                  <button
                    key={mode}
                    onClick={() => { setColorMode(mode); setPage(1) }}
                    className={`h-8 px-2.5 text-xs font-medium ${
                      colorMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sort by section */}
      <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
        <SectionHeader
          label="Sort by"
          expanded={sortExpanded}
          onToggle={() => setSortExpanded((v) => !v)}
        />
        {sortExpanded && (
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortColumn === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSortColumnClick(opt.value)}
                  className={`h-8 px-3 rounded-md text-sm font-medium border transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
            {/* Direction chip */}
            <button
              onClick={() => { setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC')); setPage(1) }}
              className="h-8 px-3 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
            >
              <span>{sortOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>
              {sortOrder === 'ASC' ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
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
      ) : (
        <CollectionImageGrid cards={data?.rows ?? []} onCardClick={handleRowClick} />
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
              &lt;&lt;
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
