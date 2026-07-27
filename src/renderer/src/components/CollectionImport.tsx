import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseCSVFile } from '@/lib/collectionImport'
import { createLogger } from '@/lib/logger'
import { getProviderByID, ProviderInfo, TransferStatus } from '../../../models/transfers'
import { TransferProviderSelector } from './TransferProviderSelector'

const DEFAULT_IMPORT_PROVIDER = getProviderByID('blisterpod')

const logger = createLogger('collection:import')

export function CollectionImport() {
    const [provider, setProvider] = useState<ProviderInfo>(DEFAULT_IMPORT_PROVIDER)
    const [state, setState] = useState<TransferStatus>('idle')
    const [result, setResult] = useState<{ inserted: number; error?: string } | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const isTransfering = state === 'transfering'

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

        try {
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
        } catch (err) {
            const errorMessage = `Import failed: ${err}`
            logger.error(errorMessage)
            setState('error')
            setResult({ inserted: 0, error: errorMessage })
        } finally {
            if (fileRef.current) {
                fileRef.current.value = ''
            }
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
                                show import issues
                            </button>
                        </>
                    )}
                </span>
            )}
            <TransferProviderSelector transferType='import' provider={provider} onProviderChange={changeProvider} />
            <label>
                <Button variant="outline" size="sm" asChild>
                    <span className={isTransfering ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}>
                        {isTransfering ? 'Importing...' : 'Choose file...'}
                    </span>
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    disabled={isTransfering}
                    onChange={handleFile}
                />
            </label>

            {state === 'error' && result && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import errors</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm max-h-96 overflow-y-auto">
                            {result.error}
                        </p>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
