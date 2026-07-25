import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { exportCollection, getDefaultFilename } from '@/lib/collectionExport'
import { getProviderByName, ProviderInfo, TransferStatus } from '../../../models/transfers'
import { TransferProviderSelector } from './TransferProviderSelector'

const DEFAULT_IMPORT_PROVIDER = getProviderByName('blisterpod')

export function CollectionExport() {
    const [provider, setProvider] = useState<ProviderInfo>(DEFAULT_IMPORT_PROVIDER)
    const [state, setState] = useState<TransferStatus>('idle')
    const [savePath, setSavePath] = useState('')
    const [exported, setExported] = useState<number | null>(null)

    const changeProvider = (p: ProviderInfo) => {
        setProvider(p)
        setState('idle')
        setExported(null)
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
        const result = await exportCollection(provider.providerID, savePath)
        setExported(result.exported)
        setState('done')
        setSavePath('')
    }

    return (
        <div className="flex items-center gap-2">
            {state === 'done' && exported !== null && (
                <span className="text-xs text-muted-foreground">{exported} rows exported</span>
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
        </div>
    )
}
