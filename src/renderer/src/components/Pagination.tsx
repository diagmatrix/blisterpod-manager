const DEFAULT_PAGE_SIZES = [30, 60, 120] as const

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizes?: readonly number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startRow = (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        {pageSizes.map((size) => (
          <button
            key={size}
            onClick={() => onPageSizeChange(size)}
            className={`px-2 py-0.5 rounded ${pageSize === size ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
          >
            {size}
          </button>
        ))}
      </div>
      <span>{startRow}–{endRow} of {total.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(1)} className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">&lt;&lt;</button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">&lt;</button>
        <span className="px-2 font-medium text-foreground">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">&gt;</button>
        <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">&gt;&gt;</button>
      </div>
    </div>
  )
}
