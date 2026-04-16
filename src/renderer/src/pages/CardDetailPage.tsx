import { useParams } from 'react-router-dom'
import { DetailSkeleton } from '@/components/skeletons'

export default function CardDetailPage() {
  const { setCode, collectorNumber, id } = useParams<{
    setCode?: string
    collectorNumber?: string
    id?: string
  }>()

  const isLoading = true // TODO: replace with actual loading state (BM-03)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Card Detail</h1>
        <p className="text-muted-foreground">
          {setCode && collectorNumber
            ? `Viewing card: ${setCode.toUpperCase()} #${collectorNumber}`
            : id
              ? `Viewing card ID: ${id}`
              : 'No card specified.'}
        </p>
        <p className="text-muted-foreground mt-1">
          Detailed card information will appear here. (BM-03)
        </p>
      </div>
      {isLoading && <DetailSkeleton />}
    </div>
  )
}
