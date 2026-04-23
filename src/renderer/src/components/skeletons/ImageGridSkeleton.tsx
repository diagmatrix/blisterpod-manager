import { Skeleton } from '@/components/ui/skeleton'

interface ImageGridSkeletonProps {
  cells?: number
}

export function ImageGridSkeleton({ cells = 24 }: ImageGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {/* Card Images */}
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[488/680] w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}
