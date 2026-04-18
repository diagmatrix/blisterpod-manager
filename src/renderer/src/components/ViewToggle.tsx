import { List, LayoutGrid } from 'lucide-react'

export type ViewMode = 'table' | 'image'

export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-md border border-input overflow-hidden">
      <button
        onClick={() => onChange('table')}
        title="Table view"
        className={`h-9 px-2 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('image')}
        title="Image view"
        className={`h-9 px-2 ${view === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  )
}
