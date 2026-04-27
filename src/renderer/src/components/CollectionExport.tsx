import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportCollection, DEFAULT_FILENAMES, type ExportFormat } from '@/lib/collectionExport'

type ExportState = 'idle' | 'exporting' | 'done'

export function CollectionExport() {
  const [format, setFormat] = useState<ExportFormat>('blisterpod')
  const [savePath, setSavePath] = useState('')
  const [state, setState] = useState<ExportState>('idle')
  const [exported, setExported] = useState<number | null>(null)

  const handleBrowse = async () => {
    const path = await window.api.showSaveDialog(DEFAULT_FILENAMES[format])
    if (path) setSavePath(path)
  }

  const handleExport = async () => {
    if (!savePath) return
    setState('exporting')
    const result = await exportCollection(format, savePath)
    setExported(result.exported)
    setState('done')
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => { setFormat(v as ExportFormat); setState('idle') }}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blisterpod">Blisterpod</SelectItem>
          <SelectItem value="moxfield">Moxfield</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={savePath}
        onChange={(e) => { setSavePath(e.target.value); setState('idle') }}
        placeholder="Save path…"
        className="h-8 w-48 text-sm"
      />
      <Button variant="outline" size="sm" onClick={handleBrowse} disabled={state === 'exporting'}>
        Browse…
      </Button>
      <Button size="sm" onClick={handleExport} disabled={!savePath || state === 'exporting'}>
        {state === 'exporting' ? 'Exporting…' : 'Export'}
      </Button>
      {state === 'done' && exported !== null && (
        <span className="text-xs text-muted-foreground">{exported} rows exported</span>
      )}
    </div>
  )
}
