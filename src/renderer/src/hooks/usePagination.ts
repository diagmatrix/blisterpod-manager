import { useCallback, useEffect, useState } from 'react'
import { FALLBACK_PAGE_SIZE, isPageSize, pageSizeFamily, type PageSize } from '../../../shared/app'
import { useDefaultPageSize } from './useDefaultPageSize'

export interface UsePaginationReturn {
    page: number
    pageSize: PageSize
    pageSizes: readonly PageSize[]
    setPage: (page: number) => void
    setPageSize: (size: PageSize) => void
    /** **WARNING**: Also resets to the first page. */
    handlePageSizeChange: (size: number) => void
    reset: () => void
}

export function usePagination(): UsePaginationReturn {
    const defaultPageSize = useDefaultPageSize()
    const pageSizes = pageSizeFamily(defaultPageSize)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState<PageSize>(FALLBACK_PAGE_SIZE)

    useEffect(() => { setPageSize(defaultPageSize) }, [defaultPageSize])

    const handlePageSizeChange = useCallback((size: number) => {
        if (!isPageSize(size) || !pageSizes.includes(size)) return
        setPageSize(size)
        setPage(1)
    }, [pageSizes])

    const reset = useCallback(() => {
        setPage(1)
        setPageSize(defaultPageSize)
    }, [defaultPageSize])

    return { page, pageSize, pageSizes, setPage, setPageSize, handlePageSizeChange, reset }
}
