import { useNavigate } from 'react-router-dom'
import { SetSymbol } from './SetSymbol'
import type { StatsSetEntry } from '../../../shared/types'

function ringColor(pct: number): string {
  if (pct >= 1)    return '#F59E0B' // gold — complete
  if (pct >= 0.67) return '#22C55E' // green
  if (pct >= 0.34) return '#3B82F6' // blue
  if (pct > 0)     return '#F97316' // orange
  return 'transparent'
}

function SetCard({ entry }: { entry: StatsSetEntry }) {
  const navigate = useNavigate()
  const pct = entry.set_cards > 0
    ? Math.min(entry.unique_printings / entry.set_cards, 1)
    : 0
  const color = ringColor(pct)

  return (
    <button
      type="button"
      onClick={() => navigate('/collection', { state: { filterSet: entry.set_code } })}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div
        className="relative w-20 h-20 rounded-full flex-shrink-0"
        style={{
          background: `conic-gradient(${color} ${pct * 360}deg, hsl(var(--border)) 0deg)`,
          padding: '3px',
        }}
      >
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
          <SetSymbol setCode={entry.base_set_code} setName={entry.set_name} size="2.5rem" />
        </div>
      </div>
      <span className="text-xs font-medium leading-tight line-clamp-2 w-full">{entry.set_name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {entry.unique_printings} / {entry.set_cards}
      </span>
    </button>
  )
}

interface SetBreakdownGridProps {
  data: StatsSetEntry[]
}

export function SetBreakdownGrid({ data }: SetBreakdownGridProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
        {data.map(entry => (
          <SetCard key={entry.set_code} entry={entry} />
        ))}
      </div>
    </div>
  )
}
