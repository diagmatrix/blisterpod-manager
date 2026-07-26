import { CollectionAddParams, SortParams, SortRequest } from "./search"

export interface PaginatedResult<T> {
    rows: T[]
    total: number
}

export interface MutationResult {
    success: boolean
    error?: string
}

export interface AddResult {
    id?: number | bigint
    error?: string
    warning?: string
}

export interface InsertResult {
    inserted: number
    error?: string
    warning?: string
}

export interface DeleteResult {
    deleted: number
    error?: string
}

export interface MergeResult {
    merged: number
    error?: string
}

export interface ExportResult {
    exported: number
    error?: string
}

export interface FileParsingResult {
    cards: CollectionAddParams[]
    error?: string
}

export interface UseCardSortReturn {
    /** Active sort chain, ordered by priority with a contiguous 1..n `sortOrder` */
    sortParams: SortParams[]
    handleSort: (params: SortRequest) => void
    removeSort: (sortColumn: string) => void
    reset: () => void
}
