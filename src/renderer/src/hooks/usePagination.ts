import { useCallback, useEffect, useState } from 'react'
import { FALLBACK_PAGE_SIZE, isPageSize, useDefaultPageSize, type PageSize } from './useDefaultPageSize'

export interface UsePaginationReturn {
  page: number
  pageSize: PageSize
  setPage: (page: number) => void
  setPageSize: (size: PageSize) => void
  /** **WARNING**: Also resets to the first page. */
  handlePageSizeChange: (size: number) => void
  reset: () => void
}

export function usePagination(): UsePaginationReturn {
  const defaultPageSize = useDefaultPageSize()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(FALLBACK_PAGE_SIZE)

  useEffect(() => { setPageSize(defaultPageSize) }, [defaultPageSize])

  const handlePageSizeChange = useCallback((size: number) => {
    if (!isPageSize(size)) return
    setPageSize(size)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(1)
    setPageSize(defaultPageSize)
  }, [defaultPageSize])

  return { page, pageSize, setPage, setPageSize, handlePageSizeChange, reset }
}
