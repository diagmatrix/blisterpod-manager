import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CollectionCard } from '../../../shared/cards'

interface DeleteCardDialogProps {
  card: CollectionCard
  collectionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCardDialog({ card, collectionId, open, onOpenChange }: DeleteCardDialogProps) {
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await window.api.collectionDelete({ id: collectionId })
    setDeleting(false)
    if ('error' in result) {
      toast.error(`Failed to delete: ${result.error}`)
    } else {
      toast.success('Card removed from collection')
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      queryClient.invalidateQueries({ queryKey: ['missing'] })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove card?</DialogTitle>
          <DialogDescription>
            {card.name} · {card.set_code} #{card.collector_number}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          This will permanently remove{' '}
          <span className="font-medium">
            {card.quantity_nonfoil} nonfoil + {card.quantity_foil} foil
          </span>{' '}
          ({card.total} total) from your collection.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
