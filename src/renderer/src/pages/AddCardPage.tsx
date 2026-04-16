import { TableSkeleton } from '@/components/skeletons'

export default function AddCardPage() {
  const isLoading = true // TODO: replace with actual loading state (BM-02)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Add Cards</h1>
        <p className="text-muted-foreground">Search and add cards to your collection. (BM-02)</p>
      </div>
      {isLoading && <TableSkeleton rows={10} />}
    </div>
  )
}
