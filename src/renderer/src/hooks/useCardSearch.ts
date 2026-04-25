import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CardSearchParams } from '../../../shared/search'

const DEBOUNCE_MS = 500

export function useCardSearch(params: CardSearchParams) {
  const latestParams = useRef(params)
  latestParams.current = params

  const [committed, setCommitted] = useState(params)
  const raritiesKey = params.rarities?.join(',') ?? ''
  const colorsKey = params.colors?.join(',') ?? ''

  useEffect(() => {
    const t = setTimeout(() => setCommitted(latestParams.current), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [
    params.query,
    params.set_code,
    raritiesKey,
    colorsKey,
    params.colorMode,
    params.page,
    params.pageSize,
  ])

  const hasFilter = !!(committed.query || committed.set_code || committed.rarities?.length || committed.colors?.length)

  const { data, isLoading } = useQuery({
    queryKey: ['card-search', committed],
    queryFn: () => window.api.cardSearch(committed),
    enabled: hasFilter,
  })

  return { rows: data?.rows ?? [], total: data?.total ?? 0, isLoading: hasFilter && isLoading }
}
