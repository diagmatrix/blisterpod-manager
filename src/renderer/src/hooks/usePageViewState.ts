import { useCallback, useState } from 'react'
import type { ViewMode } from '@/components/ViewToggle'

export interface UsePageViewStateReturn {
  view: ViewMode
  isFilterExpanded: boolean
  isSortExpanded: boolean
  setView: (view: ViewMode) => void
  toggleFilter: () => void
  toggleSort: () => void
}

interface UsePageViewStateOptions {
  defaultView?: ViewMode
}

/**
 * Holds the shared page-chrome state used by list pages: the table/image view
 * mode plus the expand/collapse state of the Filter and Sort sections.
 */
export function usePageViewState({ defaultView = 'image' }: UsePageViewStateOptions = {}): UsePageViewStateReturn {
  const [view, setView] = useState<ViewMode>(defaultView)
  const [isFilterExpanded, setFilterExpanded] = useState(true)
  const [isSortExpanded, setSortExpanded] = useState(true)

  const toggleFilter = useCallback(() => setFilterExpanded((v) => !v), [])
  const toggleSort = useCallback(() => setSortExpanded((v) => !v), [])

  return { view, isFilterExpanded, isSortExpanded, setView, toggleFilter, toggleSort }
}