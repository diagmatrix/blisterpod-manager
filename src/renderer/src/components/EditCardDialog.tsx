import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CollectionCard } from '../../../shared/types'

interface EditCardDialogProps {
  card: CollectionCard
  collectionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCardDialog({ card, collectionId, open, onOpenChange }: EditCardDialogProps) {
  const queryClient = useQueryClient()
  const [nonfoil, setNonfoil] = useState(card.quantity_nonfoil)
  const [foil, setFoil] = useState(card.quantity_foil)
  const [saving, setSaving] = useState(false)

  const isValid = nonfoil >= 0 && foil >= 0 && nonfoil + foil > 0

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    const result = await window.api.collectionUpdate({ id: collectionId, quantity_nonfoil: nonfoil, quantity_foil: foil })
    setSaving(false)
    if ('error' in result) {
      toast.error(`Failed to update: ${result.error}`)
    } else {
      toast.success('Card updated')
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit quantities</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {card.card_name} · {card.set_code} #{card.collector_number}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Nonfoil</span>
            <input
              type="number"
              min={0}
              value={nonfoil}
              onChange={(e) => setNonfoil(Math.max(0, Number(e.target.value)))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Foil</span>
            <input
              type="number"
              min={0}
              value={foil}
              onChange={(e) => setFoil(Math.max(0, Number(e.target.value)))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
        </div>

        {!isValid && (
          <p className="text-xs text-destructive">At least one copy must be owned.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
