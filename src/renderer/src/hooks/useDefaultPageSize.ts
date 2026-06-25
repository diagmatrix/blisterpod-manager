import { useEffect, useState } from 'react'

export const PAGE_SIZES = [30, 60, 120] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const FALLBACK_PAGE_SIZE: PageSize = PAGE_SIZES[0]

export function isPageSize(value: unknown): value is PageSize {
  return typeof value === 'number' && (PAGE_SIZES as readonly number[]).includes(value)
}

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
