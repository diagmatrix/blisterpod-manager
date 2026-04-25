import { TableSkeleton } from '@/components/skeletons'

export default function CollectionErrorsPage() {
  const isLoading = true // TODO: replace with actual loading state (BM-05)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Collection Errors</h1>
        <p className="text-muted-foreground">Review and fix data issues in your collection.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Duplicates</h2>
          <p className="text-sm text-muted-foreground">Detect and merge duplicate card entries. (BM-05)</p>
        </div>
        {isLoading && <TableSkeleton rows={7} />}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Missing / Not Found</h2>
          <p className="text-sm text-muted-foreground">Cards in your collection that could not be matched with Scryfall data.</p>
        </div>
        {isLoading && <TableSkeleton rows={7} />}
      </div>
    </div>
  )
}
