import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseBlisterpodCSV, parseGoogleDriveCSV, parseMoxfieldCSV } from '@/lib/collectionImport'

type ImportFormat = 'google-drive' | 'blisterpod' | 'moxfield'
type ImportState = 'idle' | 'importing' | 'done'

export function CollectionImport() {
  const [format, setFormat] = useState<ImportFormat>('google-drive')
  const [state, setState] = useState<ImportState>('idle')
  const [result, setResult] = useState<{ inserted: number; errors: { index: number; message: string }[] } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setState('importing')
    setResult(null)

    const text = await file.text()
    const items =
      format === 'blisterpod' ? parseBlisterpodCSV(text) :
      format === 'moxfield'   ? parseMoxfieldCSV(text) :
                                parseGoogleDriveCSV(text)
    const response = await window.api.collectionAddBatch(items)

    setState('done')
    setResult({ inserted: response.inserted, errors: response.errors })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => { setFormat(v as ImportFormat); setState('idle') }}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="google-drive">Google Drive</SelectItem>
          <SelectItem value="blisterpod">Blisterpod</SelectItem>
          <SelectItem value="moxfield">Moxfield</SelectItem>
        </SelectContent>
      </Select>
      <label>
        <Button variant="outline" size="sm" asChild disabled={state === 'importing'}>
          <span className="cursor-pointer">
            {state === 'importing' ? 'Importing…' : 'Choose file…'}
          </span>
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </label>
      {state === 'done' && result && (
        <span className="text-xs text-muted-foreground">
          {result.inserted} imported
          {result.errors.length > 0 && (
            <>
              {', '}
              <button
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setDialogOpen(true)}
              >
                {result.errors.length} skipped
              </button>
            </>
          )}
        </span>
      )}

      {result && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skipped cards ({result.errors.length})</DialogTitle>
            </DialogHeader>
            <ul className="list-disc list-inside space-y-1 text-sm max-h-96 overflow-y-auto">
              {result.errors.map((e) => (
                <li key={e.index}>{e.message}</li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
