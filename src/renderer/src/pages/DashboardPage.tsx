import { SummarySkeleton, ChartSkeleton } from '@/components/skeletons'

export default function DashboardPage() {
  const isLoading = true // TODO: replace with actual loading state (BM-04)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistics</h1>
        <p className="text-muted-foreground">Collection statistics and charts. (BM-04)</p>
      </div>
      {isLoading && (
        <>
          <SummarySkeleton />
          <ChartSkeleton />
        </>
      )}
    </div>
  )
}
