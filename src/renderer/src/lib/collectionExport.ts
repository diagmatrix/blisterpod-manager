export type ExportFormat = 'blisterpod' | 'moxfield'

export const DEFAULT_FILENAMES: Record<ExportFormat, string> = {
  blisterpod: 'collection.csv',
  moxfield: 'moxfield_collection.csv',
}

export async function exportCollection(format: ExportFormat, filePath: string): Promise<{ exported: number }> {
  return format === 'moxfield'
    ? window.api.exportCollectionMoxfield(filePath)
    : window.api.exportCollection(filePath)
}
