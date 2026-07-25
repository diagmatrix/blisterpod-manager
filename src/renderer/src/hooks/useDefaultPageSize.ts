import { useEffect, useState } from 'react'
import { FALLBACK_PAGE_SIZE, isPageSize, type PageSize } from '../../../models/app'

/**
 * Reads the user-configured default page size from settings, falling back to
 * {@link FALLBACK_PAGE_SIZE} until it loads (or if it is unset/invalid).
 */
export function useDefaultPageSize(): PageSize {
  const [defaultPageSize, setDefaultPageSize] = useState<PageSize>(FALLBACK_PAGE_SIZE)

  useEffect(() => {
    window.api.settingsGet('defaultPageSize').then((v) => {
      if (isPageSize(v)) setDefaultPageSize(v)
    })
  }, [])

  return defaultPageSize
}
