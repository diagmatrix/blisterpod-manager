import { Skeleton } from '@/components/ui/skeleton'

export function ChartSkeleton() {
  return (
    <div className="w-full space-y-3">
      {/* Chart title */}
      <Skeleton className="h-5 w-48" />

      {/* Chart area */}
      <div className="relative w-full h-64 flex items-end gap-2 px-8 pt-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between pb-6 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>

        {/* Bars */}
        {[55, 80, 45, 70, 90, 60, 75, 50, 85, 65].map((heightPct, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm rounded-b-none"
            style={{ height: `${heightPct}%` }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2 px-8">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-3" />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
