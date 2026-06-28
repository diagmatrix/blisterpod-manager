import { useState, useEffect } from 'react'
import type { CardFiltersState, CardFiltersHandlers, TokenFilter, ColorMode } from '@/components/CardFilters'

const MIN_SEARCH_CARD_NAME = 3
const MIN_SEARCH_SET_CODE = 2
const SEARCH_DEBOUNCE_MS = 1000

interface UseCardFiltersOptions {
  initialSet?: string
  isFilteringCollection?: boolean
  onCommit?: () => void
}

interface UseCardFiltersReturn {
  filtersState: CardFiltersState
  filtersHandlers: CardFiltersHandlers
  search: string
  searchSet: string
  tokenFilter: TokenFilter
  rarities: string[]
  colors: string[]
  colorMode: ColorMode
  reset: () => void
}

export function useCardFilters({ initialSet = '', isFilteringCollection = true, onCommit }: UseCardFiltersOptions = {}): UseCardFiltersReturn {
  /** Timeout */
  let filterTimeout = setTimeout(() => {}, SEARCH_DEBOUNCE_MS)

  /** Name filter */
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    filterTimeout = setTimeout(() => {
      const newSearch = searchInput.length >= MIN_SEARCH_CARD_NAME ? searchInput : ''
      if (newSearch !== search) { 
        setSearch(newSearch); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  }, [searchInput, search, onCommit])

  /** Set filter */
  const [searchSet, setSearchSet] = useState(initialSet)
  const [searchSetInput, setSearchSetInput] = useState(initialSet)

  useEffect(() => {
    filterTimeout = setTimeout(() => {
      const newSet = searchSetInput.length >= MIN_SEARCH_SET_CODE ? searchSetInput : ''
      if (newSet !== searchSet) { 
        setSearchSet(newSet); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  }, [searchSetInput, searchSet, onCommit])

  /** Tokens filter */
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('cards')
  const [commitedTokenFilter, setCommitedTokenFilter] = useState<TokenFilter>('cards')

  useEffect(() => {
    filterTimeout = setTimeout(() => {
      const canApplyFilter = isFilteringCollection ? true : searchSetInput.length >= MIN_SEARCH_SET_CODE || searchInput.length >= MIN_SEARCH_CARD_NAME
      if (canApplyFilter) { 
        setCommitedTokenFilter(tokenFilter); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  })

  /** Rarities filter */
  const [raritiesInput, setRaritiesInput] = useState<string[]>([])
  const [rarities, setRarities] = useState<string[]>([])
  
  useEffect(() => {
    filterTimeout = setTimeout(() => {
      const canApplyFilter = isFilteringCollection ? true : searchSetInput.length >= MIN_SEARCH_SET_CODE || searchInput.length >= MIN_SEARCH_CARD_NAME
      if (canApplyFilter) { 
        setRarities(raritiesInput); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  }, [raritiesInput, searchInput, searchSetInput, onCommit])
  
  /** Colors filters */
  const [colorsInput, setColorsInput] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [colorMode, setColorMode] = useState<ColorMode>('atLeast')
  const [committedColorMode, setCommittedColorMode] = useState<ColorMode>('atLeast')

  useEffect(() => {
    filterTimeout = setTimeout(() => { 
      const canApplyFilter = isFilteringCollection ? true : searchSetInput.length >= MIN_SEARCH_SET_CODE || searchInput.length >= MIN_SEARCH_CARD_NAME
      if (canApplyFilter) { 
        setColors(colorsInput); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  }, [colorsInput, searchInput, searchSetInput, onCommit])

  useEffect(() => {
    filterTimeout = setTimeout(() => { 
      const canApplyFilter = isFilteringCollection ? true : searchSetInput.length >= MIN_SEARCH_SET_CODE || searchInput.length >= MIN_SEARCH_CARD_NAME
      if (canApplyFilter) { 
        setCommittedColorMode(colorMode); onCommit?.() 
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(filterTimeout)
  }, [colorMode, searchInput, searchSetInput, onCommit])

  const filtersState: CardFiltersState = {
    searchInput, searchSetInput, tokenFilter, raritiesInput, colorsInput, colorMode,
  }

  const filtersHandlers: CardFiltersHandlers = {
    setSearchInput,
    setSearchSetInput,
    setTokenFilter: (v) => { setTokenFilter(v); onCommit?.() },
    toggleRarity: (r) => setRaritiesInput((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]),
    toggleColor: (c) => setColorsInput((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]),
    setColorMode,
  }

  function reset() {
    setSearchInput(''); setSearchSetInput(''); setSearch(''); setSearchSet('')
    setTokenFilter('cards')
    setRaritiesInput([]); setRarities([])
    setColorsInput([]); setColors([])
    setColorMode('atLeast'); setCommittedColorMode('atLeast')
  }

  return { filtersState, filtersHandlers, search, searchSet, tokenFilter: commitedTokenFilter, rarities, colors, colorMode: committedColorMode, reset }
}
