import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { CardSearchParams } from '../../../models/search'

/**
 * Whether a search is narrowed enough to be worth running
 */
export function isNarrowedSearch(params: CardSearchParams): boolean {
    return !!(
        params.cardName
        || params.setCode
        || params.rarities?.length
        || params.colorIdentity?.length
        || params.cardTypes?.length
    )
}

export function useCardSearch(params: CardSearchParams) {
    const hasFilter = isNarrowedSearch(params)

    const { data, isLoading } = useQuery({
        queryKey: ['card-search', params],
        queryFn: () => window.api.cardSearch(params),
        enabled: hasFilter,
        placeholderData: keepPreviousData,
    })

    return { rows: data?.rows ?? [], total: data?.total ?? 0, isLoading: hasFilter && isLoading }
}
