import { ProviderID } from "../../../models/transfers"

export function getDefaultFilename(provider: ProviderID) {
    return `${provider.toLowerCase()}_collection.csv`
}

export async function exportCollection(provider: ProviderID, filePath: string): Promise<{ exported: number }> {
    switch(provider) {
        case 'moxfield':
            return window.api.exportCollectionMoxfield(filePath)
        case 'blisterpod':
            return window.api.exportCollection(filePath)
        default:
            return Promise.reject('Invalid provider')
    }
}
