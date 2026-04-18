import { Search } from 'lucide-react'
import { COLOR_SYMBOL_MAP } from '../../../shared/types'

export type TokenFilter = 'all' | 'cards' | 'tokens'
export type ColorMode = 'including' | 'atLeast' | 'exactly' | 'atMost'

export const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C']
export const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
export const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
  special: 'Special',
  bonus: 'Bonus',
}

export interface CardFiltersState {
  searchInput: string
  searchSetInput: string
  tokenFilter: TokenFilter
  raritiesInput: string[]
  colorsInput: string[]
  colorMode: ColorMode
}

export interface CardFiltersHandlers {
  setSearchInput: (v: string) => void
  setSearchSetInput: (v: string) => void
  setTokenFilter: (v: TokenFilter) => void
  toggleRarity: (r: string) => void
  toggleColor: (c: string) => void
  setColorMode: (m: ColorMode) => void
}

interface CardFiltersProps {
  state: CardFiltersState
  handlers: CardFiltersHandlers
  showTokenFilter?: boolean
}

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'including', label: 'Including' },
  { value: 'atLeast', label: 'At least' },
  { value: 'exactly', label: 'Exactly' },
  { value: 'atMost', label: 'At most' },
]

export function CardFilters({ state, handlers, showTokenFilter = true }: CardFiltersProps) {
  const { searchInput, searchSetInput, tokenFilter, raritiesInput, colorsInput, colorMode } = state
  const { setSearchInput, setSearchSetInput, setTokenFilter, toggleRarity, toggleColor, setColorMode } = handlers

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Name search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Name (min 2)…"
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

      <div className="h-6 w-px bg-border mx-1" />

      {/* Token segmented control */}
      {showTokenFilter && (
        <>
          <div className="flex items-center rounded-md border border-input overflow-hidden">
            {(['all', 'cards', 'tokens'] as TokenFilter[]).map((opt) => (
              <button
                key={opt}
                onClick={() => setTokenFilter(opt)}
                className={`h-9 px-3 text-sm capitalize ${tokenFilter === opt ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-border mx-1" />
        </>
      )}

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
        {COLOR_MODE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setColorMode(value)}
            className={`h-8 px-2.5 text-xs font-medium ${
              colorMode === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
