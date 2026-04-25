import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CollectionCard } from '../../../shared/types'

interface CardQuickDialogProps {
  card: CollectionCard
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardQuickDialog({ card, open, onOpenChange }: CardQuickDialogProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [nonfoil, setNonfoil] = useState(card.quantity_nonfoil)
  const [foil, setFoil] = useState(card.quantity_foil)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgErrored, setImgErrored] = useState(false)

  const busy = saving || deleting
  const isValid = nonfoil >= 0 && foil >= 0 && nonfoil + foil > 0
  const imageSrc =
    !imgErrored && card.scryfall_id && card.image_url
      ? `card-image://${card.scryfall_id}?u=${encodeURIComponent(card.image_url)}`
      : null

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    const result = await window.api.collectionUpdate({
      id: card.collection_id,
      quantity_nonfoil: nonfoil,
      quantity_foil: foil,
    })
    setSaving(false)
    if ('error' in result) {
      toast.error(`Failed to update: ${result.error}`)
    } else {
      toast.success('Card updated')
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      onOpenChange(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await window.api.collectionDelete({ id: card.collection_id })
    setDeleting(false)
    if ('error' in result) {
      toast.error(`Failed to delete: ${result.error}`)
    } else {
      toast.success('Card removed from collection')
      queryClient.invalidateQueries({ queryKey: ['collection'] })
      onOpenChange(false)
    }
  }

  function handleGoToDetails() {
    onOpenChange(false)
    navigate(`/card-detail/${card.set_code}/${card.collector_number}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md [&>button:last-of-type]:hidden">
        {/* Header with card name and set info */}
        <DialogHeader>
          <DialogTitle>{card.card_name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {card.set_code.toUpperCase()} #{card.collector_number}
        </p>

        
        {confirmDelete ? (
          // Confirm delete dialog
          <>
            <p className="text-sm">
              This will permanently remove{' '}
              <span className="font-medium">
                {card.quantity_nonfoil} nonfoil + {card.quantity_foil} foil
              </span>{' '}
              ({card.total} total) from your collection.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Edit quantities dialog
          <>
            <div className="flex gap-3">
              <div className="flex-1 aspect-[488/680] rounded-md overflow-hidden border bg-muted">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={card.card_name}
                    onError={() => setImgErrored(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-muted-foreground">
                    {card.card_name}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 flex-1">
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
                <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Remove from collection
                </Button>
                <Button variant="outline" onClick={handleGoToDetails} disabled={busy}>
                  Go to card details
                </Button>
                {!isValid && (
                  <p className="text-xs text-destructive">At least one copy must be owned.</p>
                )}
              </div>
            </div>
            
            {/* Dialog footer */}
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isValid || busy}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
