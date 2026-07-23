import { Search } from 'lucide-react'
import { COLOR_SYMBOL_MAP, WUBRG_ORDER } from '../../../shared/mana'
import type { CardFiltersState, CardFiltersHandlers, LayoutFilter, ColorMode } from '../../../shared/search'

export const RARITY_OPTIONS = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
export const RARITY_LABELS: Record<string, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    mythic: 'Mythic',
    special: 'Special',
    bonus: 'Bonus',
}

interface CardFiltersProps {
    state: CardFiltersState
    handlers: CardFiltersHandlers
    showLayoutFilter?: boolean
}

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
    { value: 'atLeast', label: 'At least' },
    { value: 'exactly', label: 'Exactly' },
    { value: 'atMost', label: 'At most' },
]

export function CardFilters({ state, handlers, showLayoutFilter = true }: CardFiltersProps) {
    const { searchCardNameInput, searchSetInput, layoutFilter, raritiesInput, colorIdentityInput, colorMode } = state
    const { setSearchCardNameInput, setSearchSetInput, setLayoutFilter, toggleRarity, toggleColorIdentity, setColorMode } = handlers

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Name search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    title="At least 3 characters to search by name"
                    placeholder="Card name ..."
                    value={searchCardNameInput}
                    onChange={(e) => setSearchCardNameInput(e.target.value)}
                    className="h-9 w-48 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
            </div>

            {/* Set search */}
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    title="At least 2 characters to search by set"
                    placeholder="Set code ..."
                    value={searchSetInput}
                    onChange={(e) => setSearchSetInput(e.target.value.toUpperCase())}
                    className="h-9 w-32 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring uppercase"
                />
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Layout segmented control */}
            {showLayoutFilter && (
                <>
                    <div className="flex items-center rounded-md border border-input overflow-hidden">
                        {(['all', 'cards', 'tokens'] as LayoutFilter[]).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setLayoutFilter(opt)}
                                className={`h-9 px-3 text-sm capitalize ${layoutFilter === opt ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                    className={`h-8 px-2.5 rounded-md text-xs font-medium border transition-colors ${raritiesInput.includes(r)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                >
                    {RARITY_LABELS[r]}
                </button>
            ))}

            <div className="h-6 w-px bg-border mx-1" />

            {/* Color toggles */}
            {WUBRG_ORDER.map((c) => (
                <button
                    key={c}
                    onClick={() => toggleColorIdentity(c)}
                    title={c}
                    className={`w-8 h-8 rounded-md border flex items-center justify-center transition-all ${colorIdentityInput.includes(c)
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
                        className={`h-8 px-2.5 text-xs font-medium ${colorMode === value
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
