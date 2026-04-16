import { TableSkeleton } from '@/components/skeletons'

export default function DuplicatesPage() {
  const isLoading = true // TODO: replace with actual loading state (BM-05)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Duplicates</h1>
        <p className="text-muted-foreground">Detect and merge duplicate card entries. (BM-05)</p>
      </div>
      {isLoading && <TableSkeleton />}
    </div>
  )
}
