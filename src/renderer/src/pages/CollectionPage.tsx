import { TableSkeleton } from '@/components/skeletons'

export default function CollectionPage() {
  const isLoading = true // TODO: replace with actual loading state (BM-01)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Collection</h1>
        <p className="text-muted-foreground">Browse your card collection. (BM-01)</p>
      </div>
      {isLoading && <TableSkeleton />}
    </div>
  )
}
