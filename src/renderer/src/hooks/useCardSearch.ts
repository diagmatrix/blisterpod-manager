import { useState, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { CardSearchParams } from '../../../shared/search'

const DEBOUNCE_MS = 500

type FilterParams = Omit<CardSearchParams, 'page' | 'pageSize' | 'sortColumn' | 'sortOrder'>

export function useCardSearch(params: CardSearchParams) {
  const { page, pageSize, sortColumn, sortOrder, ...filterParams } = params
  const latestFilters = useRef<FilterParams>(filterParams)
  latestFilters.current = filterParams

  const [committedFilters, setCommittedFilters] = useState<FilterParams>(filterParams)
  const raritiesKey = params.rarities?.join(',') ?? ''
  const colorsKey = params.colors?.join(',') ?? ''

  useEffect(() => {
    const t = setTimeout(() => setCommittedFilters(latestFilters.current), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [
    params.query,
    params.set_code,
    raritiesKey,
    colorsKey,
    params.colorMode,
    params.tokenFilter,
  ])

  const committedParams: CardSearchParams = { ...committedFilters, page, pageSize, sortColumn, sortOrder }
  const hasFilter = !!(committedFilters.query || committedFilters.set_code || committedFilters.rarities?.length || committedFilters.colors?.length)

  const { data, isLoading } = useQuery({
    queryKey: ['card-search', committedParams],
    queryFn: () => window.api.cardSearch(committedParams),
    enabled: hasFilter,
    placeholderData: keepPreviousData,
  })

  return { rows: data?.rows ?? [], total: data?.total ?? 0, isLoading: hasFilter && isLoading }
}
