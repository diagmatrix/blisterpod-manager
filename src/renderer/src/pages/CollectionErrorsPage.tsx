import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TableSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { MergeDuplicateCardDialog } from '@/components/MergeDuplicateDialog'
import type { DuplicateCard, MissingCard } from '../../../shared/cards'
import { Pencil, RefreshCw, Trash2, X } from 'lucide-react'

interface MissingTableProps {
  cards: MissingCard[]
}

function DuplicateCardTable({ duplicates, setMergeTarget }: { duplicates: DuplicateCard[]; setMergeTarget: (dup: DuplicateCard) => void }) {
  return (
    <div className="rounded-md border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Set code</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Collector number</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Total nonfoil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Total foil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">DuplicateCard count</th>
            <th className="px-3 py-2 w-20" />
          </tr>
        </thead>
        <tbody>
          {duplicates?.map((dup) => (
            <tr
              key={`${dup.set_code}-${dup.collector_number}`}
              className="border-b border-border/50 divide-x-2 divide-border/30 hover:bg-muted/30 transition-colors"
            >
              <td className="px-3 py-1.5 font-medium">{dup.name}</td>
              <td className="px-3 py-1.5 text-center uppercase">{dup.set_code}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dup.collector_number}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dup.total_nonfoil}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dup.total_foil}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{dup.row_count}</td>
              <td className="px-3 py-1.5 text-right">
                <Button size="sm" variant="outline" onClick={() => setMergeTarget(dup)}>
                  Merge rows
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MissingTable(missing: MissingTableProps) {
  return (
    <div className="rounded-md border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b border-border divide-x-2 divide-border/30">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Set code</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Collector number</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Nonfoil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Foil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-36">Set cards missing</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Set metadata missing</th>
            <th className="px-3 py-2 w-40" />
          </tr>
        </thead>
        <tbody>
          {missing.cards?.map((row) => (
            <tr
              key={`${row.set_code}-${row.collector_number}`}
              className="border-b border-border/50 divide-x-2 divide-border/30 hover:bg-muted/30 transition-colors"
            >
              <td className="px-3 py-1.5 font-medium uppercase">{row.set_code}</td>
              <td className="px-3 py-1.5 text-center tabular-nums">{row.collector_number}</td>
              <td className="px-3 py-1.5 text-center tabular-nums">{row.quantity_nonfoil}</td>
              <td className="px-3 py-1.5 text-center tabular-nums">{row.quantity_foil}</td>
              <td className="px-3 py-1.5 text-center">
                {!!row.set_cards_missing ? (
                  <Button size="sm" variant="outline" disabled>
                    <RefreshCw className="h-4 w-4" />
                    Fetch cards
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <X className="h-4 w-4" />
                    No cards missing
                  </Button>
                )}
              </td>
              <td className="px-3 py-1.5 text-center">
                {!!row.set_metadata_missing ? (
                  <Button size="sm" variant="outline" disabled>
                    <RefreshCw className="h-4 w-4" />
                    Fetch set
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <X className="h-4 w-4" />
                    No set metadata missing
                  </Button>
                )}
              </td>
              <td className="px-3 py-1.5 w-16 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" disabled>
                    <RefreshCw className="h-4 w-4" />
                    Fetch card
                  </Button>
                  <Button
                    title="Edit card details"
                    disabled
                    size="sm"
                    variant="outline"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    title="Remove from collection"
                    disabled
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CollectionErrorsPage() {
  const [mergeTarget, setMergeTarget] = useState<DuplicateCard | null>(null)

  const { data: duplicates, isLoading, isError } = useQuery({
    queryKey: ['duplicates'],
    queryFn: () => window.api.duplicatesList(),
  })

  const { data: missing, isLoading: missingLoading, isError: missingError } = useQuery({
    queryKey: ['missing'],
    queryFn: () => window.api.missingList(),
  })

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Collection Errors</h1>
        <p className="text-muted-foreground">Review and fix data issues in your collection.</p>
      </div>

      {/* DuplicateCards section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Duplicate cards</h2>
          <p className="text-sm text-muted-foreground">Detect and merge duplicate card entries.</p>
        </div>
        {isLoading ? (
          <TableSkeleton rows={7} />
        ) : isError ? (
          <p className="text-sm text-destructive">Error loading duplicates.</p>
        ) : duplicates?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No duplicates found. Your collection is clean!</p>
        ) : (
          <DuplicateCardTable duplicates={duplicates ?? []} setMergeTarget={setMergeTarget} />
        )}
      </div>
      
      {/* Missing cards section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Missing / Not Found</h2>
          <p className="text-sm text-muted-foreground">Cards in your collection that could not be matched with Scryfall data.</p>
        </div>
        {missingLoading ? (
          <TableSkeleton rows={7} />
        ) : missingError ? (
          <p className="text-sm text-destructive">Error loading missing cards.</p>
        ) : missing?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unmatched cards found. Your collection is clean!</p>
        ) : (
          <MissingTable cards={missing ?? []} />
        )}
      </div>

      {mergeTarget && (
        <MergeDuplicateCardDialog
          duplicate={mergeTarget}
          open={!!mergeTarget}
          onOpenChange={(open) => { if (!open) setMergeTarget(null) }}
        />
      )}
    </div>
  )
}
