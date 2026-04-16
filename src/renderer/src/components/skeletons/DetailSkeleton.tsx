import { Skeleton } from '@/components/ui/skeleton'

export function DetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-4">
      {/* Card image */}
      <div className="flex-shrink-0">
        <Skeleton className="w-64 h-[356px] rounded-xl" />
      </div>

      {/* Card details */}
      <div className="flex-1 space-y-4">
        {/* Card name */}
        <Skeleton className="h-8 w-3/4" />

        {/* Subtitle (type line) */}
        <Skeleton className="h-4 w-1/2" />

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Text fields */}
        <div className="space-y-2">
          {[70, 90, 60, 80].map((widthPct, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${widthPct}%` }} />
          ))}
        </div>

        {/* Set / collector info row */}
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Price section */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-6">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        {/* Quantity controls */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}
