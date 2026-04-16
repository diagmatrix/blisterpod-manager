import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
}

const COLUMN_WIDTHS = ['w-2/5', 'w-1/6', 'w-1/6', 'w-1/12', 'w-1/12', 'w-1/6']

export function TableSkeleton({ rows = 20 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-2">
      {/* Header row */}
      <div className="flex items-center gap-3 px-3 pb-2 border-b border-border">
        {COLUMN_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-3 px-3 py-1">
          {COLUMN_WIDTHS.map((w, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-4 ${w} ${colIndex === 0 ? 'opacity-90' : 'opacity-60'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
