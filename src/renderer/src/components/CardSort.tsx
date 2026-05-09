import { ChevronUp, ChevronDown } from 'lucide-react'

export interface SortOption {
  value: string
  label: string
}

interface CardSortProps {
  options: SortOption[]
  sortColumn: string
  sortOrder: 'ASC' | 'DESC'
  onSort: (column: string) => void
  onToggleOrder: () => void
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'set_code', label: 'Set code' },
  { value: 'collector_number', label: 'Collector number' },
]

export function CardSort({ options, sortColumn, sortOrder, onSort, onToggleOrder }: CardSortProps) {
  const allOptions = options.length > 0 ? DEFAULT_SORT_OPTIONS.concat(options) : DEFAULT_SORT_OPTIONS
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allOptions.map((opt) => {
        const isActive = sortColumn === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onSort(opt.value)}
            className={`h-8 px-3 rounded-md text-sm font-medium border transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {opt.label}
          </button>
        )
      })}
      <button
        onClick={onToggleOrder}
        className="h-8 px-3 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <span>{sortOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>
        {sortOrder === 'ASC' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
