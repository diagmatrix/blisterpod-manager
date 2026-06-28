import { useCallback, useState } from 'react'

export interface UseRowSelectionReturn {
  selectedIds: Set<number>
  count: number
  toggleSingle: (id: number) => void
  toggleAll: (ids: number[], selected: boolean) => void
  clear: () => void
}

/**
 * Manages a set of selected row ids, decoupled from the data source: callers
 * pass the relevant ids into {@link toggleAll} (e.g. the current page's ids).
 */
export function useRowSelection(): UseRowSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSingle = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  const toggleAll = useCallback((ids: number[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        ids.forEach((id) => next.add(id))
      } else {
        ids.forEach((id) => next.delete(id))
      }

      return next
    })
  }, [])

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  return { selectedIds, count: selectedIds.size, toggleSingle, toggleAll, clear }
}