import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { DuplicateCard } from '../../../shared/cards'

interface MergeDuplicateCardDialogProps {
  duplicate: DuplicateCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MergeDuplicateCardDialog({ duplicate, open, onOpenChange }: MergeDuplicateCardDialogProps) {
  const queryClient = useQueryClient()
  const [merging, setMerging] = useState(false)

  async function handleMerge() {
    setMerging(true)
    const result = await window.api.duplicatesMerge({
      set_code: duplicate.set_code,
      collector_number: duplicate.collector_number,
    })
    setMerging(false)
    if ('error' in result) {
      toast.error(`Failed to merge: ${result.error}`)
    } else {
      toast.success('Duplicate cards merged successfully')
      queryClient.invalidateQueries({ queryKey: ['duplicates'] })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Merge duplicates?</DialogTitle>
          <DialogDescription>
            {duplicate.name} · {duplicate.set_code} #{duplicate.collector_number}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          Merge{' '}
          <span className="font-medium">{duplicate.row_count} duplicate entries</span> into one row,
          summing to{' '}
          <span className="font-medium">
            {duplicate.total_nonfoil} nonfoil + {duplicate.total_foil} foil
          </span>. This cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merging}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={merging}>
            {merging ? 'Merging…' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
