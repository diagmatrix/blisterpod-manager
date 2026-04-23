import { useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { SetSymbol } from './SetSymbol'
import { cn } from '@/lib/utils'

const FACTS = [
  "A blisterpod's corpse is a scion's cradle.",
  "Eldrazi spawn are not their cherished young—they are smaller weapons.",
  "Each Eldrazi ancient spawned a lineage of horrors in unfathomable shapes.",
  "Kozilek's brood infiltrates and deceives. The spawn of Ulamog mindlessly consume.",
  "The Edge is littered with the vestiges of civilizations annihilated by the Eldrazi.",
  "Only the Eldrazi mind thinks in the warped paths required to open the hedrons and tap the power within.",
  "The barest taste of Eldrazi power shatters both realms and identities.",
  "Eldrazi grow wherever something else dies.",
]

const SET_CODES = ['roe', 'mh3', 'bfz', 'ddp', 'ogw', 'm3c']

export function RefreshLoadingDialog({ open }: { open: boolean }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!open) {
      setTick(0)
      return
    }
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [open])

  const fact = FACTS[tick % FACTS.length]
  const setCode = SET_CODES[tick % SET_CODES.length]

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
            'border bg-background p-8 shadow-lg sm:rounded-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          )}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <SetSymbol setCode={setCode} size="1.5rem" />
              <p className="text-sm font-medium leading-snug">
                Scions are working! While you wait, you may love to hear these facts:
              </p>
              <SetSymbol setCode={setCode} size="1.5rem" />
            </div>
            <p key={tick} className="text-muted-foreground italic min-h-[3rem] flex items-center justify-center">
              {fact}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
