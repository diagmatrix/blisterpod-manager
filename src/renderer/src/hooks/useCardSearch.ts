import { useState, useEffect, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { CardSearchParams } from '../../../models/search'

const DEBOUNCE_MS = 500

type FilterParams = Omit<CardSearchParams, 'page' | 'pageSize' | 'sort'>

export function useCardSearch(params: CardSearchParams) {
    const { page, pageSize, sort, ...filterParams } = params
    const latestFilters = useRef<FilterParams>(filterParams)
    latestFilters.current = filterParams

    const [committedFilters, setCommittedFilters] = useState<FilterParams>(filterParams)
    const raritiesKey = params.rarities?.join(',') ?? ''
    const colorsKey = params.colorIdentity?.join(',') ?? ''

    useEffect(() => {
        const t = setTimeout(() => setCommittedFilters(latestFilters.current), DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [
        params.cardName,
        params.setCode,
        raritiesKey,
        colorsKey,
        params.colorMode,
        params.layoutFilter,
    ])

    const committedParams: CardSearchParams = { ...committedFilters, page, pageSize, sort }
    const hasFilter = !!(committedFilters.cardName || committedFilters.setCode || committedFilters.rarities?.length || committedFilters.colorIdentity?.length)

    const { data, isLoading } = useQuery({
        queryKey: ['card-search', committedParams],
        queryFn: () => window.api.cardSearch(committedParams),
        enabled: hasFilter,
        placeholderData: keepPreviousData,
    })

    return { rows: data?.rows ?? [], total: data?.total ?? 0, isLoading: hasFilter && isLoading }
}
