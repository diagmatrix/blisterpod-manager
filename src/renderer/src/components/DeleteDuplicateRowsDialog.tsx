import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { DuplicateCard } from '../../../shared/cards'

interface DeleteDuplicateRowsDialogProps {
  duplicate: DuplicateCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDuplicateRowsDialog({ duplicate, open, onOpenChange }: DeleteDuplicateRowsDialogProps) {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const ids = duplicate.row_ids.split(', ').map(Number)

  const { data: rows, refetch } = useQuery({
    queryKey: ['duplicate-rows', duplicate.set_code, duplicate.collector_number],
    queryFn: () => window.api.duplicatesRows(ids),
    enabled: open,
  })

  async function handleDelete(id: number) {
    setDeletingId(id)
    const result = await window.api.collectionDelete({ id })
    setDeletingId(null)
    if ('error' in result) {
      toast.error(`Failed to remove row: ${result.error}`)
    } else {
      toast.success('Row removed')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg [&>button:last-of-type]:hidden">
        <DialogHeader>
          <DialogTitle>Remove duplicate rows</DialogTitle>
          <DialogDescription>
            {duplicate.name} · {duplicate.set_code.toUpperCase()} #{duplicate.collector_number}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/80">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row ID</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-28">Nonfoil</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-28">Foil</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{row.id}</td>
                  <td className="px-3 py-1.5 text-center tabular-nums">{row.quantity_nonfoil}</td>
                  <td className="px-3 py-1.5 text-center tabular-nums">{row.quantity_foil}</td>
                  <td className="px-3 py-1.5 text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === row.id || (rows?.length ?? 0) <= 1}
                      onClick={() => handleDelete(row.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          The last remaining row cannot be removed.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Ok</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
