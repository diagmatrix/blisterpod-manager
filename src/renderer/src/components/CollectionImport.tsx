import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseCSVFile } from '@/lib/collectionImport'
import { getProviderByName, ProviderInfo, TransferStatus } from '../../../models/transfers'
import { TransferProviderSelector } from './TransferProviderSelector'

const DEFAULT_IMPORT_PROVIDER = getProviderByName('blisterpod')

export function CollectionImport() {
    const [provider, setProvider] = useState<ProviderInfo>(DEFAULT_IMPORT_PROVIDER)
    const [state, setState] = useState<TransferStatus>('idle')
    const [result, setResult] = useState<{ inserted: number; error?: string } | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const changeProvider = (p: ProviderInfo) => {
        setProvider(p)
        setState('idle')
        setResult(null)
    }

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            return
        }

        setState('transfering')
        setResult(null)

        const text = await file.text()
        const parsingResult = parseCSVFile(text, provider.providerID)
        const insertResult = await window.api.collectionAddBatch(parsingResult.cards)

        let error: string | undefined
        if (parsingResult.error) {
            error = parsingResult.error
        }
        if (insertResult.error) {
            error = error ? `${error}. ${insertResult.error}` : insertResult.error
        }

        if (error) {
            setState('error')
        } else {
            setState('done')
        }

        setResult({ inserted: insertResult.inserted, error: error })

        if (fileRef.current) {
            fileRef.current.value = ''
        }
    }

    return (
        <div className="flex items-center gap-2">
            {(state === 'done' || state === 'error') && result && (
                <span className="text-xs text-muted-foreground">
                    {result.inserted} imported
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
            <TransferProviderSelector transferType='import' initialValue={provider} onProviderChange={changeProvider} />
            <label>
                <Button variant="outline" size="sm" asChild disabled={state === 'transfering'}>
                    <span className="cursor-pointer">
                        {state === 'transfering' ? 'Importing...' : 'Choose file...'}
                    </span>
                </Button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            {state === 'error' && result && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import errors</DialogTitle>
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
