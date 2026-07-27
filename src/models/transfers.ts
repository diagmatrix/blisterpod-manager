interface Provider {
    name: string
    import: boolean
    export: boolean
}

const PROVIDERS = {
    'blisterpod': { name: 'Blisterpod', import: true, export: true },
    'moxfield': { name: 'Moxfield', import: true, export: true },
    'googleDrive': { name: 'Google Drive', import: true, export: false },
    'manabox': { name: 'Manabox', import: true, export: true },
    'invalid': { name: 'Invalid Provider', import: false, export: false }
} as const satisfies Record<string, Provider>

export type ProviderID = keyof typeof PROVIDERS
export type TransferStatus = 'idle' | 'transfering' | 'done' | 'error'
export type TransferType = 'import' | 'export'

export interface ProviderInfo extends Provider {
    providerID: ProviderID
}

export function getProviders(transferType: TransferType): ProviderInfo[] {
    return (Object.entries(PROVIDERS) as [ProviderID, Provider][])
        .filter(([, provider]) => provider[transferType])
        .map(([id, provider]) => ({providerID: id, ...provider}))
}

export function getProviderByID(providerID: ProviderID): ProviderInfo {
    const provider = PROVIDERS[providerID]
    if (provider) {
        return {providerID, ...provider}
    }

    // Return invalid as default
    return {providerID: 'invalid', ...PROVIDERS.invalid}
}
