import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScryfallCard } from '../../../shared/cards'
import type { BatchItem } from '../../../shared/search'

interface BatchPanelProps {
  items: BatchItem[]
  onAddCard: (item: BatchItem) => void
  onUpdate: (index: number, nonfoil: number, foil: number) => void
  onRemove: (index: number) => void
  onDiscard: () => void
  onAddAll: () => Promise<void>
  isAdding: boolean
}

export function BatchPanel({ items, onAddCard, onUpdate, onRemove, onDiscard, onAddAll, isAdding }: BatchPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [directSet, setDirectSet] = useState('')
  const [directNum, setDirectNum] = useState('')
  const [directNF, setDirectNF] = useState(1)
  const [directFoil, setDirectFoil] = useState(0)
  const [directError, setDirectError] = useState('')
  const [directLoading, setDirectLoading] = useState(false)

  async function handleDirectAdd() {
    if (!directSet || !directNum) return
    setDirectError('')
    setDirectLoading(true)
    const results = await window.api.cardSearch({ set_code: directSet.toUpperCase(), pageSize: 500 })
    setDirectLoading(false)
    const match = results.rows.find((c: ScryfallCard) => c.collector_number === directNum.trim())
    if (!match) {
      setDirectError(`Not found: ${directSet.toUpperCase()} #${directNum}`)
      return
    }
    if (directNF + directFoil === 0) {
      setDirectError('At least one copy required')
      return
    }
    onAddCard({ card: match, quantity_nonfoil: directNF, quantity_foil: directFoil })
    setDirectSet(''); setDirectNum(''); setDirectNF(1); setDirectFoil(0)
  }

  return (
    <div className={`flex flex-col border border-border rounded-md bg-background transition-all ${expanded ? 'w-72' : 'w-10'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        {expanded && (
          <span className="text-sm font-semibold flex items-center gap-2">
            Batch
            {items.length > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                {items.length}
              </span>
            )}
          </span>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
          title={expanded ? 'Collapse batch panel' : 'Expand batch panel'}
        >
          {expanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Direct-add form */}
          <div className="border-t border-border px-3 py-2 flex flex-col gap-2 items-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add directly</p>
            <div className="flex gap-2">
              <div className='flex flex-col items-center gap-1.5 justify-end w-[70%]'>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Set
                  <input
                    type="text"
                    placeholder="BFZ"
                    value={directSet}
                    onChange={(e) => setDirectSet(e.target.value.toUpperCase())}
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs uppercase focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  Number
                  <input
                    type="text"
                    placeholder="163"
                    value={directNum}
                    onChange={(e) => setDirectNum(e.target.value)}
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-1.5 justify-end items-center w-[30%]">
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  NF
                  <input
                    type="number"
                    min={0}
                    value={directNF}
                    onChange={(e) => setDirectNF(Math.max(0, Number(e.target.value)))}
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  F
                  <input
                    type="number"
                    min={0}
                    value={directFoil}
                    onChange={(e) => setDirectFoil(Math.max(0, Number(e.target.value)))}
                    className="w-full h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </label>
              </div>
            </div>
            {directError && <p className="text-xs text-destructive">{directError}</p>}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDirectAdd}
              disabled={!directSet || !directNum || directLoading}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              {directLoading ? 'Looking up…' : 'Add to batch'}
            </Button>
          </div>

          {/* Header actions */}
          <div className="border-t border-border px-3 py-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDiscard}
              disabled={items.length === 0 || isAdding}
            >
              Discard
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={onAddAll}
              disabled={items.length === 0 || isAdding}
            >
              {isAdding ? 'Adding…' : 'Add all'}
            </Button>
          </div>

          {/* Batch items list */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/50">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No cards in batch. Search and click a result to add.</p>
            ) : (
              items.map((item, i) => (
                <div key={i} className="px-3 py-2 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.card.name}</p>
                      <p className="text-xs text-muted-foreground">{item.card.set_code} #{item.card.collector_number}</p>
                    </div>
                    <button
                      onClick={() => onRemove(i)}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      NF
                      <input
                        type="number"
                        min={0}
                        value={item.quantity_nonfoil}
                        onChange={(e) => onUpdate(i, Math.max(0, Number(e.target.value)), item.quantity_foil)}
                        className="w-14 h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      F
                      <input
                        type="number"
                        min={0}
                        value={item.quantity_foil}
                        onChange={(e) => onUpdate(i, item.quantity_nonfoil, Math.max(0, Number(e.target.value)))}
                        className="w-14 h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
