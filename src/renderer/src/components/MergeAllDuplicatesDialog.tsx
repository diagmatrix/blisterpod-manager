import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MergeAllDuplicatesDialogProps {
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MergeAllDuplicatesDialog({ count, open, onOpenChange }: MergeAllDuplicatesDialogProps) {
  const queryClient = useQueryClient()
  const [merging, setMerging] = useState(false)

  async function handleMergeAll() {
    setMerging(true)
    const result = await window.api.duplicatesMergeAll()
    setMerging(false)
    if ('error' in result) {
      toast.error(`Failed to merge: ${result.error}`)
    } else {
      toast.success(`Merged ${result.merged} duplicate group${result.merged !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Merge all duplicates?</DialogTitle>
          <DialogDescription>
            {count} duplicate group{count !== 1 ? 's' : ''} will be merged.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          Each group's quantities will be summed into a single row. This cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merging}>
            Cancel
          </Button>
          <Button onClick={handleMergeAll} disabled={merging}>
            {merging ? 'Merging…' : 'Merge all'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
