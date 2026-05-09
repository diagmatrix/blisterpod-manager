import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RemoveAllDuplicatesDialogProps {
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveAllDuplicatesDialog({ count, open, onOpenChange }: RemoveAllDuplicatesDialogProps) {
  const queryClient = useQueryClient()
  const [removing, setRemoving] = useState(false)

  async function handleRemoveAll() {
    setRemoving(true)
    const result = await window.api.duplicatesRemoveAll()
    setRemoving(false)
    if ('error' in result) {
      toast.error(`Failed to remove: ${result.error}`)
    } else {
      toast.success(`Removed ${result.removed} duplicate row${result.removed !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove all duplicates?</DialogTitle>
          <DialogDescription>
            {count} duplicate group{count !== 1 ? 's' : ''} will be cleaned up.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          For each group, the first row will be kept and all others deleted. Quantities are <span className="font-medium">not</span> merged. This cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={removing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemoveAll} disabled={removing}>
            {removing ? 'Removing…' : 'Remove all'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
