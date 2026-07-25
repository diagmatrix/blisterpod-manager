import { useState, useEffect } from 'react'
import type {
    CardFiltersState, CardFiltersHandlers, LayoutFilter, ColorMode, UseCardFiltersReturn,
} from '../../../models/search'

const MIN_SEARCH_CARD_NAME = 3
const MIN_SEARCH_SET_CODE = 2
const SEARCH_DEBOUNCE_MS = 1000

interface UseCardFiltersOptions {
    initialSet?: string
    isFilteringCollection?: boolean
    onCommit?: () => void
}

interface DebouncedCommitOptions<T> {
    pending: T // Current value from input
    committed: T // Query value
    enabled?: boolean // Until true, the pending value is uncommited
    commit: (value: T) => void
    onCommit?: () => void
}

/**
 * Commits `pending` once it has been stable for {@link SEARCH_DEBOUNCE_MS}, and
 * fires `onCommit` only when the value really changed
 */
function useDebouncedCommit<T>({ pending, committed, commit, enabled = true, onCommit }: DebouncedCommitOptions<T>): void {
    const pendingKey = String(pending)
    const committedKey = String(committed)

    useEffect(() => {
        if (!enabled || pendingKey === committedKey) {
            return
        }
        const t = setTimeout(() => { commit(pending); onCommit?.() }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [pending, pendingKey, committedKey, commit, enabled, onCommit])
}

export function useCardFilters({ initialSet = '', isFilteringCollection = true, onCommit }: UseCardFiltersOptions = {}): UseCardFiltersReturn {
    const [searchCardNameInput, setSearchCardNameInput] = useState('')
    const [searchCardName, setSearchCardName] = useState('')
    const pendingSearchCardName = searchCardNameInput.length >= MIN_SEARCH_CARD_NAME ? searchCardNameInput : ''
    useDebouncedCommit({ pending: pendingSearchCardName, committed: searchCardName, commit: setSearchCardName, onCommit })

    const [searchSet, setSearchSet] = useState(initialSet)
    const [searchSetInput, setSearchSetInput] = useState(initialSet)
    const pendingSearchSet = searchSetInput.length >= MIN_SEARCH_SET_CODE ? searchSetInput : ''
    useDebouncedCommit({ pending: pendingSearchSet, committed: searchSet, commit: setSearchSet, onCommit })

    // Outside the collection, the secondary filters stay pending until the search itself is specific enough.
    const canApplyFilter = isFilteringCollection || !!pendingSearchCardName || !!pendingSearchSet

    const [layoutFilter, setLayoutFilter] = useState<LayoutFilter>('cards')
    const [commitedLayoutFilter, setCommitedLayoutFilter] = useState<LayoutFilter>('cards')
    useDebouncedCommit({
        pending: layoutFilter, committed: commitedLayoutFilter, commit: setCommitedLayoutFilter,
        enabled: canApplyFilter, onCommit,
    })

    const [raritiesInput, setRaritiesInput] = useState<string[]>([])
    const [rarities, setRarities] = useState<string[]>([])
    useDebouncedCommit({
        pending: raritiesInput, committed: rarities, commit: setRarities,
        enabled: canApplyFilter, onCommit,
    })

    const [colorIdentityInput, setColorIdentityInput] = useState<string[]>([])
    const [colorIdentity, setColorIdentity] = useState<string[]>([])
    const [colorMode, setColorMode] = useState<ColorMode>('atLeast')
    const [committedColorMode, setCommittedColorMode] = useState<ColorMode>('atLeast')
    useDebouncedCommit({
        pending: colorIdentityInput, committed: colorIdentity, commit: setColorIdentity,
        enabled: canApplyFilter, onCommit,
    })
    useDebouncedCommit({
        pending: colorMode, committed: committedColorMode, commit: setCommittedColorMode,
        enabled: canApplyFilter, onCommit,
    })

    const filtersState: CardFiltersState = {
        searchCardNameInput, searchSetInput, layoutFilter, raritiesInput, colorIdentityInput, colorMode,
    }

    const filtersHandlers: CardFiltersHandlers = {
        setSearchCardNameInput,
        setSearchSetInput,
        setLayoutFilter,
        toggleRarity: (r) => setRaritiesInput((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]),
        toggleColorIdentity: (c) => setColorIdentityInput((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
        setColorMode,
    }

    function reset() {
        setSearchCardNameInput(''); setSearchSetInput(''); setSearchCardName(''); setSearchSet('')
        setLayoutFilter('cards'); setCommitedLayoutFilter('cards')
        setRaritiesInput([]); setRarities([])
        setColorIdentityInput([]); setColorIdentity([])
        setColorMode('atLeast'); setCommittedColorMode('atLeast')
    }

    return { filtersState, filtersHandlers, searchCardName, searchSet, layoutFilter: commitedLayoutFilter, rarities, colorIdentity, colorMode: committedColorMode, reset }
}
