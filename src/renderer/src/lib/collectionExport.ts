import { ExportResult } from "../../../models/responses"
import { ProviderID } from "../../../models/transfers"

export function getDefaultFilename(provider: ProviderID) {
    return `${provider.toLowerCase()}_collection.csv`
}

export async function exportCollection(provider: ProviderID, filePath: string): Promise<ExportResult> {
    switch(provider) {
        case 'moxfield':
            return window.api.exportCollectionMoxfield(filePath)
        case 'blisterpod':
            return window.api.exportCollection(filePath)
        case 'manabox':
            return window.api.exportCollectionManabox(filePath)
        default:
            return { exported: 0, error: 'Invalid provider' }
    }
}
