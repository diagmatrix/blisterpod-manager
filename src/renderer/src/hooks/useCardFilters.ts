import { useCallback, useMemo, useState } from 'react'
import type {
    CardFiltersState, CardFiltersHandlers, LayoutFilter, ColorMode,
} from '../../../models/search'

export interface CommittedCardFilters {
    searchCardName: string
    searchSet: string
    layoutFilter: LayoutFilter
    rarities: string[]
    colorIdentity: string[]
    colorMode: ColorMode
    cardTypes: string[]
}

export interface UseCardFiltersReturn extends CommittedCardFilters {
    filtersState: CardFiltersState
    filtersHandlers: CardFiltersHandlers
    commit: () => void
    reset: () => void
}

const MIN_SEARCH_CARD_NAME = 3
const MIN_SEARCH_SET_CODE = 2

interface UseCardFiltersOptions {
    initialSet?: string
    onCommit?: () => void
}

export function normaliseCardType(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function useCardFilters({ initialSet = '', onCommit }: UseCardFiltersOptions = {}): UseCardFiltersReturn {
    const [searchCardNameInput, setSearchCardNameInput] = useState('')
    const [searchSetInput, setSearchSetInput] = useState(initialSet)
    const [layoutFilter, setLayoutFilter] = useState<LayoutFilter>('cards')
    const [raritiesInput, setRaritiesInput] = useState<string[]>([])
    const [colorIdentityInput, setColorIdentityInput] = useState<string[]>([])
    const [colorMode, setColorMode] = useState<ColorMode>('atLeast')
    const [cardTypesInput, setCardTypesInput] = useState<string[]>([])
    const [cardTypeDraft, setCardTypeDraft] = useState('')

    const pending: CommittedCardFilters = useMemo(() => ({
        searchCardName: searchCardNameInput.length >= MIN_SEARCH_CARD_NAME ? searchCardNameInput : '',
        searchSet: searchSetInput.length >= MIN_SEARCH_SET_CODE ? searchSetInput : '',
        layoutFilter,
        rarities: raritiesInput,
        colorIdentity: colorIdentityInput,
        colorMode,
        cardTypes: cardTypesInput,
    }), [searchCardNameInput, searchSetInput, layoutFilter, raritiesInput, colorIdentityInput, colorMode, cardTypesInput])

    const [committed, setCommitted] = useState<CommittedCardFilters>(pending)

    const commit = useCallback(() => {
        setCommitted(pending)
        onCommit?.()
    }, [pending, onCommit])

    const reset = useCallback(() => {
        setSearchCardNameInput(''); setSearchSetInput('')
        setLayoutFilter('cards')
        setRaritiesInput([])
        setColorIdentityInput([]); setColorMode('atLeast')
        setCardTypesInput([]); setCardTypeDraft('')
        setCommitted({
            searchCardName: '', searchSet: '', layoutFilter: 'cards',
            rarities: [], colorIdentity: [], colorMode: 'atLeast', cardTypes: [],
        })
    }, [])

    const filtersState: CardFiltersState = {
        searchCardNameInput, searchSetInput, layoutFilter, raritiesInput, colorIdentityInput, colorMode,
        cardTypesInput, cardTypeDraft,
    }

    const filtersHandlers: CardFiltersHandlers = {
        setSearchCardNameInput,
        setSearchSetInput,
        setLayoutFilter,
        toggleRarity: (r) => setRaritiesInput((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]),
        toggleColorIdentity: (c) => setColorIdentityInput((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
        setColorMode,
        setCardTypeDraft,
        addCardType: (t) => {
            const cardType = normaliseCardType(t)
            if (!cardType) {
                return
            }
            setCardTypesInput((prev) => prev.includes(cardType) ? prev : [...prev, cardType])
            setCardTypeDraft('')
        },
        removeCardType: (t) => setCardTypesInput((prev) => prev.filter((x) => x !== t)),
    }

    return {
        ...committed,
        filtersState,
        filtersHandlers,
        commit,
        reset,
    }
}
