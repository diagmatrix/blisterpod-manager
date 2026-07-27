import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getProviderByID, getProviders, ProviderID, ProviderInfo, TransferType } from '../../../models/transfers'

interface TransferProviderSelectorProps {
    transferType: TransferType
    provider: ProviderInfo
    onProviderChange: (provider: ProviderInfo) => void
}

export function TransferProviderSelector({ transferType, provider, onProviderChange }: TransferProviderSelectorProps) {
    const providers = getProviders(transferType)

    return (
        <Select value={provider.providerID} onValueChange={(v) => onProviderChange(getProviderByID(v as ProviderID))}>
            <SelectTrigger className="w-36">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {providers.map((p) => (
                    <SelectItem key={p.providerID} value={p.providerID}>
                        {p.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
