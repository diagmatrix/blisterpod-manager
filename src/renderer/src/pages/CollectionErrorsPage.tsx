import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TableSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { MergeDuplicateCardDialog } from '@/components/MergeDuplicateDialog'
import { MergeAllDuplicatesDialog } from '@/components/MergeAllDuplicatesDialog'
import { RemoveAllDuplicatesDialog } from '@/components/RemoveAllDuplicatesDialog'
import { DeleteDuplicateRowsDialog } from '@/components/DeleteDuplicateRowsDialog'
import { CardQuickDialog } from '@/components/CardQuickDialog'
import { DeleteCardDialog } from '@/components/DeleteCardDialog'
import type { DuplicateCard, MissingCard, CollectionCard } from '../../../shared/cards'
import { missingCardToCollectionCard } from '../../../shared/cards'
import { Pencil, RefreshCw, Trash2, X } from 'lucide-react'

interface DuplicateTableProps {
  duplicates: DuplicateCard[]
  onMerge: (dup: DuplicateCard) => void
  onDelete: (dup: DuplicateCard) => void
}

interface MissingTableProps {
  cards: MissingCard[]
  loadingKeys: Set<string>
  onFetchSet: (row: MissingCard) => void
  onFetchCards: (row: MissingCard) => void
  onFetchCard: (row: MissingCard) => void
  onEdit: (row: MissingCard) => void
  onDelete: (row: MissingCard) => void
}

function DuplicateCardTable({ duplicates, onMerge, onDelete }: DuplicateTableProps) {
  return (
    <div className="rounded-md border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground min-w-80">Name</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Set code</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Collector number</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Total nonfoil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Total foil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Duplicate count</th>
            <th className="px-3 py-2 w-40" />
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
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="outline" title="Merge rows" onClick={() => onMerge(dup)}>
                    Merge rows
                  </Button>
                  <Button size="sm" variant="destructive" title="Delete duplicate" onClick={() => onDelete(dup)}>
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

function MissingTable({ cards, loadingKeys, onFetchSet, onFetchCards, onFetchCard, onEdit, onDelete }: MissingTableProps) {
  return (
    <div className="rounded-md border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b border-border divide-x-2 divide-border/30">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Set code</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Collector number</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Nonfoil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Foil</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-36">Set cards</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-40">Set metadata</th>
            <th className="px-3 py-2 w-52" />
          </tr>
        </thead>
        <tbody>
          {cards?.map((row) => {
            const fetchSetKey = `fetch-set:${row.set_code}`
            const fetchCardsKey = `fetch-cards:${row.set_code}`
            const fetchCardKey = `fetch-card:${row.set_code}:${row.collector_number}`
            return (
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
                    <Button size="sm" variant="outline" disabled={loadingKeys.has(fetchCardsKey)} onClick={() => onFetchCards(row)}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingKeys.has(fetchCardsKey) ? 'animate-spin' : ''}`} />
                      Fetch cards
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <X className="h-3 w-3" /> OK
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-center">
                  {!!row.set_metadata_missing ? (
                    <Button size="sm" variant="outline" disabled={loadingKeys.has(fetchSetKey)} onClick={() => onFetchSet(row)}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingKeys.has(fetchSetKey) ? 'animate-spin' : ''}`} />
                      Fetch set
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <X className="h-3 w-3" /> OK
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" disabled={loadingKeys.has(fetchCardKey)} onClick={() => onFetchCard(row)}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingKeys.has(fetchCardKey) ? 'animate-spin' : ''}`} />
                      Fetch card
                    </Button>
                    <Button size="sm" variant="outline" title="Edit card reference" onClick={() => onEdit(row)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="destructive" title="Remove from collection" onClick={() => onDelete(row)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function CollectionErrorsPage() {
  const queryClient = useQueryClient()
  const [mergeTarget, setMergeTarget] = useState<DuplicateCard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DuplicateCard | null>(null)
  const [editCard, setEditCard] = useState<CollectionCard | null>(null)
  const [deleteCard, setDeleteCard] = useState<CollectionCard | null>(null)
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())

  function addKey(key: string) { setLoadingKeys((prev) => new Set([...prev, key])) }
  function removeKey(key: string) { setLoadingKeys((prev) => { const s = new Set(prev); s.delete(key); return s }) }

  const [mergeAllOpen, setMergeAllOpen] = useState(false)
  const [removeAllOpen, setRemoveAllOpen] = useState(false)

  const { data: duplicates, isLoading, isError } = useQuery({
    queryKey: ['duplicates'],
    queryFn: () => window.api.duplicatesList(),
  })

  const { data: missing, isLoading: missingLoading, isError: missingError } = useQuery({
    queryKey: ['missing'],
    queryFn: () => window.api.missingList(),
  })

  async function handleFetchSet(row: MissingCard) {
    const key = `fetch-set:${row.set_code}`
    addKey(key)
    const result = await window.api.missingFetchSet({ set_code: row.set_code })
    removeKey(key)
    if ('error' in result) {
      toast.error(`Failed to fetch set: ${result.error}`)
    } else {
      toast.success(`Set ${row.set_code.toUpperCase()} metadata fetched`)
      queryClient.invalidateQueries({ queryKey: ['missing'] })
    }
  }

  async function handleFetchCards(row: MissingCard) {
    const key = `fetch-cards:${row.set_code}`
    addKey(key)
    const result = await window.api.missingFetchCards({ set_code: row.set_code })
    removeKey(key)
    if ('error' in result) {
      toast.error(`Failed to fetch cards: ${result.error}`)
    } else {
      toast.success(`${result.inserted} card(s) fetched for ${row.set_code.toUpperCase()}`)
      queryClient.invalidateQueries({ queryKey: ['missing'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
    }
  }

  async function handleFetchCard(row: MissingCard) {
    const key = `fetch-card:${row.set_code}:${row.collector_number}`
    addKey(key)
    const result = await window.api.missingFetchCard({ set_code: row.set_code, collector_number: row.collector_number })
    removeKey(key)
    if ('error' in result) {
      toast.error(`Failed to fetch card: ${result.error}`)
    } else {
      toast.success('Card fetched from Scryfall')
      queryClient.invalidateQueries({ queryKey: ['missing'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Collection Errors</h1>
        <p className="text-muted-foreground">Review and fix data issues in your collection.</p>
      </div>

      {/* Duplicate cards section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Duplicate cards</h2>
            <p className="text-sm text-muted-foreground">Detect and merge duplicate card entries.</p>
          </div>
          {!!duplicates?.length && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMergeAllOpen(true)}>
                Merge all
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setRemoveAllOpen(true)}>
                Remove all
              </Button>
            </div>
          )}
        </div>
        {isLoading ? (
          <TableSkeleton rows={7} />
        ) : isError ? (
          <p className="text-sm text-destructive">Error loading duplicates.</p>
        ) : duplicates?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No duplicates found. Your collection is clean!</p>
        ) : (
          <DuplicateCardTable duplicates={duplicates ?? []} onMerge={setMergeTarget} onDelete={setDeleteTarget} />
        )}
      </div>

      {/* Missing / Not Found section */}
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
          <MissingTable
            cards={missing ?? []}
            loadingKeys={loadingKeys}
            onFetchSet={handleFetchSet}
            onFetchCards={handleFetchCards}
            onFetchCard={handleFetchCard}
            onEdit={(row) => setEditCard(missingCardToCollectionCard(row))}
            onDelete={(row) => setDeleteCard(missingCardToCollectionCard(row))}
          />
        )}
      </div>
      
      {/* Dialogs */}
      <MergeAllDuplicatesDialog
        count={duplicates?.length ?? 0}
        open={mergeAllOpen}
        onOpenChange={setMergeAllOpen}
      />
      <RemoveAllDuplicatesDialog
        count={duplicates?.length ?? 0}
        open={removeAllOpen}
        onOpenChange={setRemoveAllOpen}
      />
      {deleteTarget && (
        <DeleteDuplicateRowsDialog
          duplicate={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        />
      )}
      {mergeTarget && (
        <MergeDuplicateCardDialog
          duplicate={mergeTarget}
          open={!!mergeTarget}
          onOpenChange={(open) => { if (!open) setMergeTarget(null) }}
        />
      )}
      {editCard && (
        <CardQuickDialog
          card={editCard}
          open={!!editCard}
          editRef
          onOpenChange={(open) => { if (!open) setEditCard(null) }}
        />
      )}
      {deleteCard && (
        <DeleteCardDialog
          card={deleteCard}
          collectionId={deleteCard.collection_id}
          open={!!deleteCard}
          onOpenChange={(open) => { if (!open) setDeleteCard(null) }}
        />
      )}
    </div>
  )
}
