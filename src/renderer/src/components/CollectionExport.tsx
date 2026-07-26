import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { exportCollection, getDefaultFilename } from '@/lib/collectionExport'
import { getProviderByName, ProviderInfo, TransferStatus } from '../../../models/transfers'
import { TransferProviderSelector } from './TransferProviderSelector'
import { ExportResult } from '../../../models/responses'
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog'
import { DialogHeader } from './ui/dialog'

const DEFAULT_IMPORT_PROVIDER = getProviderByName('blisterpod')

export function CollectionExport() {
    const [provider, setProvider] = useState<ProviderInfo>(DEFAULT_IMPORT_PROVIDER)
    const [state, setState] = useState<TransferStatus>('idle')
    const [savePath, setSavePath] = useState('')
    const [result, setResult] = useState<ExportResult | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const changeProvider = (p: ProviderInfo) => {
        setProvider(p)
        setState('idle')
        setResult(null)
    }

    const handleBrowse = async () => {
        const path = await window.api.showSaveDialog(getDefaultFilename(provider.providerID))
        if (path) {
            setSavePath(path)
        }
    }

    const handleExport = async () => {
        if (!savePath) {
            return
        }
        
        setState('transfering')
        setResult(null)

        const result = await exportCollection(provider.providerID, savePath)
        setResult(result)

        if (result.error) {
            setState('error')
        } else {
            setState('done')
        }

        setSavePath('')
    }

    return (
        <div className="flex items-center gap-2">
            {(state === 'done' || state === 'error') && result && (
                <span className="text-xs text-muted-foreground">
                    {result.exported} rows exported
                    {state === 'error' && (
                        <>
                            {' - '}
                            <button
                                className="underline underline-offset-2 hover:text-foreground"
                                onClick={() => setDialogOpen(true)}
                            >
                                show errors
                            </button>
                        </>
                    )}
                </span>
            )}
            <TransferProviderSelector transferType='export' initialValue={provider} onProviderChange={changeProvider} />
            <Input
                value={savePath}
                onChange={(e) => { setSavePath(e.target.value); setState('idle') }}
                placeholder="Save path..."
                className="h-8 w-48 text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleBrowse} disabled={state === 'transfering'}>
                Browse...
            </Button>
            <Button size="sm" onClick={handleExport} disabled={!savePath || state === 'transfering'}>
                {state === 'transfering' ? 'Exporting...' : 'Export'}
            </Button>
            {state === 'error' && result && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export errors</DialogTitle>
                        </DialogHeader>
                        <ul className="list-disc list-inside space-y-1 text-sm max-h-96 overflow-y-auto">
                            {result.error?.split('. ').map((message, i) => (
                                <li key={i}>{message}</li>
                            ))}
                        </ul>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
