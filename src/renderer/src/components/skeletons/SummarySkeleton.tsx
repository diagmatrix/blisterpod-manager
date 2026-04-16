import { Skeleton } from '@/components/ui/skeleton'

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          {/* Card label */}
          <Skeleton className="h-3 w-3/4" />
          {/* Big number */}
          <Skeleton className="h-8 w-1/2" />
          {/* Subtitle / delta */}
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
