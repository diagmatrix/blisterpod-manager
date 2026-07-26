import { ChevronUp, ChevronDown, Minus, X, ArrowDownUp, RotateCcw } from 'lucide-react'
import type { SortParams } from '../../../models/search'
import type { UseCardSortReturn } from '../../../models/responses'

interface SortOption {
    value: string
    label: string
}

interface CardSortProps {
    options: SortOption[]
    sort: UseCardSortReturn
    onCommit: (sortParams: SortParams[]) => void
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'set_code', label: 'Set code' },
    { value: 'collector_number_normalised', label: 'Collector number' },
    { value: 'mana_value', label: 'Mana value' },
]

const CIRCLE_CLASSES = 'relative w-5 h-5 shrink-0 rounded-full border inline-flex items-center justify-center text-[10px] font-semibold leading-none'

interface SortOptionButtonProps {
    option: SortOption
    params?: SortParams
    onSort: () => void
    onRemove: () => void
}

function SortOptionButton({ option, params, onSort, onRemove }: SortOptionButtonProps) {
    const isActive = !!params

    return (
        <div
            className={`h-8 inline-flex items-center rounded-md border text-sm font-medium transition-colors ${isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
            {isActive && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${option.label} from sorting`}
                    title={`Remove ${option.label} from sorting`}
                    className={`${CIRCLE_CLASSES} group/remove ml-2 border-primary-foreground/50 hover:bg-primary-foreground hover:text-primary hover:border-primary-foreground transition-colors`}
                >
                    <span className="group-hover/remove:opacity-0">{params.sortOrder}</span>
                    <X className="w-3 h-3 absolute opacity-0 group-hover/remove:opacity-100" />
                </button>
            )}
            <button
                type="button"
                onClick={onSort}
                aria-pressed={isActive}
                title={isActive ? `Flip ${option.label} direction` : `Sort by ${option.label}`}
                className={`h-full inline-flex items-center gap-1.5 pr-2.5 ${isActive ? 'pl-1.5' : 'pl-2'}`}
            >
                {!isActive && <span className={`${CIRCLE_CLASSES} border-muted-foreground/40`} />}
                <span>{option.label}</span>
                {!params ? (
                    <Minus className="w-3.5 h-3.5" />
                ) : params.sortDirection === 'ASC' ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                )}
            </button>
        </div>
    )
}

export function CardSort({ options, sort, onCommit }: CardSortProps) {
    const { sortParams, handleSort, removeSort, reset } = sort
    const allOptions = options.length > 0 ? DEFAULT_SORT_OPTIONS.concat(options) : DEFAULT_SORT_OPTIONS

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => onCommit(sortParams)}
                title="Apply this sorting"
                className="h-8 px-3 rounded-md border border-primary bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>Sort</span>
            </button>
            <button
                type="button"
                onClick={reset}
                title="Restore the default sorting"
                className="h-8 px-3 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
            </button>

            <div className="w-px h-6 bg-border" />

            {allOptions.map((opt) => (
                <SortOptionButton
                    key={opt.value}
                    option={opt}
                    params={sortParams.find((p) => p.sortColumn === opt.value)}
                    onSort={() => handleSort({ sortColumn: opt.value })}
                    onRemove={() => removeSort(opt.value)}
                />
            ))}
        </div>
    )
}
