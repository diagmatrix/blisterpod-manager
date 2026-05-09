import { useState, useCallback } from 'react'

type SortOrder = 'ASC' | 'DESC'

interface UseCardSortOptions {
  defaultColumn: string
  defaultOrder?: SortOrder
}

export interface UseCardSortReturn {
  sortColumn: string
  sortOrder: SortOrder
  handleSort: (column: string) => void
  toggleOrder: () => void
  reset: () => void
}

export function useCardSort({ defaultColumn, defaultOrder = 'ASC' }: UseCardSortOptions): UseCardSortReturn {
  const [sortColumn, setSortColumn] = useState(defaultColumn)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder)

  const handleSort = useCallback((column: string) => {
    if (column === sortColumn) {
      setSortOrder((prev) => prev === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortColumn(column)
      setSortOrder('ASC')
    }
  }, [sortColumn])

  const toggleOrder = useCallback(() => {
    setSortOrder((prev) => prev === 'ASC' ? 'DESC' : 'ASC')
  }, [])

  const reset = useCallback(() => {
    setSortColumn(defaultColumn)
    setSortOrder(defaultOrder)
  }, [defaultColumn, defaultOrder])

  return { sortColumn, sortOrder, handleSort, toggleOrder, reset }
}
