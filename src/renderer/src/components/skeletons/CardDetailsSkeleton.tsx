import { Skeleton } from '@/components/ui/skeleton'

export function CardDetailsSkeleton({totalBoxes = 4}: { totalBoxes?: number }) {
    return (
        <div className="p-6 space-y-6 max-w-5xl">
            <Skeleton className="h-8 w-20" />
            <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-64 aspect-[488/680] rounded-lg shrink-0" />
            <div className="flex-1 space-y-4">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[...Array(totalBoxes)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
            </div>
            </div>
        </div>
    )
}
