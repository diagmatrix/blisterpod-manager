import { useState, useCallback } from 'react'
import type { SortDirection, SortParams, SortRequest } from '../../../models/search'

export interface UseCardSortReturn {
    /** Active sort chain, ordered by priority with a contiguous 1..n `sortOrder` */
    sortParams: SortParams[]
    handleSort: (params: SortRequest) => void
    removeSort: (sortColumn: string) => void
    reset: () => void
}

const DEFAULT_SORT_DIRECTION: SortDirection = 'ASC'

type SortEntry = Omit<SortParams, 'sortOrder'>

function numberSortParams(entries: SortEntry[]): SortParams[] {
    return entries.map(({ sortColumn, sortDirection }, index) => ({
        sortColumn, sortDirection, sortOrder: index + 1,
    }))
}

function toSortParams(requests: SortRequest[]): SortParams[] {
    const prioritised = [...requests].sort(
        (a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
    )

    const entries: SortEntry[] = []
    for (const { sortColumn, sortDirection } of prioritised) {
        if (entries.some((e) => e.sortColumn === sortColumn)) {
            continue
        }
        entries.push({ sortColumn, sortDirection: sortDirection ?? DEFAULT_SORT_DIRECTION })
    }

    return numberSortParams(entries)
}

export function useCardSort(defaultSortParams: SortRequest[] = []): UseCardSortReturn {
    const [defaults] = useState<SortParams[]>(() => toSortParams(defaultSortParams))
    const [sortParams, setSortParams] = useState<SortParams[]>(defaults)

    const handleSort = useCallback(({ sortColumn, sortDirection, sortOrder }: SortRequest) => {
        setSortParams((prev) => {
            const current = prev.find((p) => p.sortColumn === sortColumn)
            const others: SortEntry[] = prev.filter((p) => p.sortColumn !== sortColumn)

            const flipped: SortDirection = current?.sortDirection === 'ASC' ? 'DESC' : 'ASC'
            const direction = sortDirection ?? (current ? flipped : DEFAULT_SORT_DIRECTION)

            const priority = sortOrder ?? current?.sortOrder ?? others.length + 1
            const index = Math.min(Math.max(priority, 1), others.length + 1) - 1

            const entries = [...others]
            entries.splice(index, 0, { sortColumn, sortDirection: direction })

            return numberSortParams(entries)
        })
    }, [])

    const removeSort = useCallback((sortColumn: string) => {
        setSortParams((prev) => numberSortParams(prev.filter((p) => p.sortColumn !== sortColumn)))
    }, [])

    const reset = useCallback(() => setSortParams(defaults), [defaults])

    return { sortParams, handleSort, removeSort, reset }
}
