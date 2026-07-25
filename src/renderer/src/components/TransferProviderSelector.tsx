import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getProviderByName, getProviders, ProviderID, ProviderInfo, TransferType } from '../../../models/transfers'

interface TransferProviderSelectorProps {
    transferType: TransferType
    initialValue: ProviderInfo
    onProviderChange: (provider: ProviderInfo) => void
}

export function TransferProviderSelector({ transferType, initialValue, onProviderChange }: TransferProviderSelectorProps) {
    const providers = getProviders(transferType)

    return (
        <Select value={initialValue.providerID} onValueChange={(v) => onProviderChange(getProviderByName(v as ProviderID))}>
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
