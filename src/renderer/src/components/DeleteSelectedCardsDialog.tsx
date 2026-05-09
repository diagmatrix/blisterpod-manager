import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteSelectedCardsDialogProps {
  ids: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteSelectedCardsDialog({ ids, open, onOpenChange, onDeleted }: DeleteSelectedCardsDialogProps) {
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await window.api.collectionDeleteMany(ids)
    setDeleting(false)
    toast.success(`${result.deleted} card${result.deleted !== 1 ? 's' : ''} removed from collection`)
    queryClient.invalidateQueries({ queryKey: ['collection'] })
    queryClient.invalidateQueries({ queryKey: ['missing'] })
    onDeleted()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove {ids.length} card{ids.length !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            {ids.length} selected entr{ids.length !== 1 ? 'ies' : 'y'} will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm">This cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removing…' : `Remove ${ids.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
