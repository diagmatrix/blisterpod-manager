import { useState, useEffect } from 'react'
import type { CardFiltersState, CardFiltersHandlers, TokenFilter, ColorMode } from '@/components/CardFilters'

const MIN_SEARCH_CARD_NAME = 3
const MIN_SEARCH_SET_CODE = 2
const SEARCH_DEBOUNCE_MS = 500

interface UseCardFiltersOptions {
  initialSet?: string
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

export function useCardFilters({ initialSet = '', onCommit }: UseCardFiltersOptions = {}): UseCardFiltersReturn {
  const [searchInput, setSearchInput] = useState('')
  const [searchSetInput, setSearchSetInput] = useState(initialSet)
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('cards')
  const [raritiesInput, setRaritiesInput] = useState<string[]>([])
  const [colorsInput, setColorsInput] = useState<string[]>([])
  const [colorMode, setColorMode] = useState<ColorMode>('atLeast')

  const [search, setSearch] = useState('')
  const [searchSet, setSearchSet] = useState(initialSet)
  const [rarities, setRarities] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [committedColorMode, setCommittedColorMode] = useState<ColorMode>('atLeast')

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.length >= MIN_SEARCH_CARD_NAME ? searchInput : ''
      if (next !== search) { setSearch(next); onCommit?.() }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput, search, onCommit])

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchSetInput.length >= MIN_SEARCH_SET_CODE ? searchSetInput : ''
      if (next !== searchSet) { setSearchSet(next); onCommit?.() }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchSetInput, searchSet, onCommit])

  useEffect(() => {
    const t = setTimeout(() => { setRarities(raritiesInput); onCommit?.() }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [raritiesInput, onCommit])

  useEffect(() => {
    const t = setTimeout(() => { setColors(colorsInput); onCommit?.() }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [colorsInput, onCommit])

  useEffect(() => {
    const t = setTimeout(() => { setCommittedColorMode(colorMode); onCommit?.() }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [colorMode, onCommit])

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

  return { filtersState, filtersHandlers, search, searchSet, tokenFilter, rarities, colors, colorMode: committedColorMode, reset }
}
