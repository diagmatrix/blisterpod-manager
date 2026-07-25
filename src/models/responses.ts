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
}
