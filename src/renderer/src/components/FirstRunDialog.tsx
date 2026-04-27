import { useState } from 'react'
import { RefreshCw, Check } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { injectKeyruneCSS } from '@/lib/keyruneCSS'
import { RefreshLoadingDialog } from '@/components/RefreshLoadingDialog'

interface FirstRunDialogProps {
  open: boolean
  onClose: () => void
}

export function FirstRunDialog({ open, onClose }: FirstRunDialogProps) {
  const [refreshCardsPending, setRefreshCardsPending] = useState(false)
  const [refreshSetsPending, setRefreshSetsPending] = useState(false)
  const [refreshManaSymbolsPending, setRefreshManaSymbolsPending] = useState(false)
  const [refreshSetSymbolsPending, setRefreshSetSymbolsPending] = useState(false)
  const [refreshAllPending, setRefreshAllPending] = useState(false)

  const [cardsRefreshed, setCardsRefreshed] = useState(false)
  const [setsRefreshed, setSetsRefreshed] = useState(false)
  const [manaSymbolsRefreshed, setManaSymbolsRefreshed] = useState(false)
  const [setSymbolsRefreshed, setSetSymbolsRefreshed] = useState(false)

  const isAnyPending =
    refreshAllPending ||
    refreshCardsPending ||
    refreshSetsPending ||
    refreshManaSymbolsPending ||
    refreshSetSymbolsPending

  const allRefreshed = cardsRefreshed && setsRefreshed && manaSymbolsRefreshed && setSymbolsRefreshed
  const requiredRefreshed = manaSymbolsRefreshed && setSymbolsRefreshed

  const handleRefreshCards = async () => {
    setRefreshCardsPending(true)
    try {
      await window.api.refreshCards()
      window.api.settingsSet('cardsLastRefreshed', new Date().toISOString())
      setCardsRefreshed(true)
    } finally {
      setRefreshCardsPending(false)
    }
  }

  const handleRefreshSets = async () => {
    setRefreshSetsPending(true)
    try {
      await window.api.refreshSets()
      window.api.settingsSet('setsLastRefreshed', new Date().toISOString())
      setSetsRefreshed(true)
    } finally {
      setRefreshSetsPending(false)
    }
  }

  const handleRefreshManaSymbols = async () => {
    setRefreshManaSymbolsPending(true)
    try {
      await window.api.refreshManaSymbols()
      window.api.settingsSet('manaSymbolsLastRefreshed', new Date().toISOString())
      setManaSymbolsRefreshed(true)
    } finally {
      setRefreshManaSymbolsPending(false)
    }
  }

  const handleRefreshSetSymbols = async () => {
    setRefreshSetSymbolsPending(true)
    try {
      await window.api.refreshSetSymbols()
      injectKeyruneCSS()
      setSetSymbolsRefreshed(true)
    } finally {
      setRefreshSetSymbolsPending(false)
    }
  }

  const handleRefreshAll = async () => {
    setRefreshAllPending(true)
    try {
      await Promise.all([
        handleRefreshCards(),
        handleRefreshSets(),
        handleRefreshManaSymbols(),
        handleRefreshSetSymbols(),
      ])
    } finally {
      setRefreshAllPending(false)
    }
  }

  const handleDismiss = () => {
    window.api.settingsSet('firstRun', false)
    onClose()
  }

  const handleRestart = () => {
    window.api.settingsSet('firstRun', false)
    window.api.restartApp()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            className={cn(
              'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
              'border bg-background p-8 shadow-lg sm:rounded-lg',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            )}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Welcome to Blisterpod Manager</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Download the latest data from Scryfall before you start. Items marked{' '}
                  <span className="text-destructive font-medium">required</span> must be downloaded
                  — the app will not display correctly without them.
                </p>
              </div>

              <div className="space-y-1">
                <RefreshRow
                  label="Cards"
                  description="Card catalog from Scryfall"
                  pending={refreshCardsPending}
                  done={cardsRefreshed}
                  disabled={isAnyPending}
                  onRefresh={handleRefreshCards}
                />
                <RefreshRow
                  label="Sets"
                  description="Magic sets and their metadata"
                  pending={refreshSetsPending}
                  done={setsRefreshed}
                  disabled={isAnyPending}
                  onRefresh={handleRefreshSets}
                />
                <RefreshRow
                  label="Mana Symbols"
                  description="Mana symbol images"
                  required
                  pending={refreshManaSymbolsPending}
                  done={manaSymbolsRefreshed}
                  disabled={isAnyPending}
                  onRefresh={handleRefreshManaSymbols}
                />
                <RefreshRow
                  label="Set Symbols"
                  description="Set symbol icons (Keyrune)"
                  required
                  pending={refreshSetSymbolsPending}
                  done={setSymbolsRefreshed}
                  disabled={isAnyPending}
                  onRefresh={handleRefreshSetSymbols}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshAll}
                  disabled={isAnyPending || allRefreshed}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshAllPending ? 'animate-spin' : ''}`} />
                  {refreshAllPending ? 'Refreshing…' : allRefreshed ? 'All done' : 'Refresh All'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={isAnyPending || !requiredRefreshed}>
                    Set up later
                  </Button>
                  {allRefreshed && (
                    <Button size="sm" onClick={handleRestart}>
                      Restart App
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <RefreshLoadingDialog open={isAnyPending} />
    </>
  )
}

function RefreshRow({
  label,
  description,
  required,
  pending,
  done,
  disabled,
  onRefresh,
}: {
  label: string
  description: string
  required?: boolean
  pending: boolean
  done: boolean
  disabled: boolean
  onRefresh: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="min-w-0 flex items-center gap-2">
        {done ? (
          <Check className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            {label}
            {required && !done && (
              <span className="text-xs text-destructive font-medium">Required</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={disabled || done}
        className="shrink-0 gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
        {pending ? 'Refreshing…' : done ? 'Done' : 'Refresh'}
      </Button>
    </div>
  )
}
