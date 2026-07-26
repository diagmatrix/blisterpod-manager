import { describe, expect, it, vi } from 'vitest'
import { exportCollection, getDefaultFilename } from './collectionExport'
import { mockWindowApi } from '../../../../tests/renderer/window-api'

// `exportCollection` is pure routing: it picks a preload bridge method per
// provider. The tests below pin which method each provider reaches, because a
// mis-wired case would silently write the wrong CSV format rather than fail.
describe('collectionExport', () => {
    describe('getDefaultFilename', () => {
        it('lowercases the provider id', () => {
            expect(getDefaultFilename('blisterpod')).toBe('blisterpod_collection.csv')
            expect(getDefaultFilename('moxfield')).toBe('moxfield_collection.csv')
            expect(getDefaultFilename('manabox')).toBe('manabox_collection.csv')
            expect(getDefaultFilename('googleDrive')).toBe('googledrive_collection.csv')
        })
    })

    describe('routing', () => {
        it('sends blisterpod to the native export handler', async () => {
            const api = mockWindowApi()

            await expect(exportCollection('blisterpod', 'C:/tmp/out.csv')).resolves.toEqual({ exported: 0 })

            expect(api.exportCollection).toHaveBeenCalledWith('C:/tmp/out.csv')
            expect(api.exportCollectionMoxfield).not.toHaveBeenCalled()
            expect(api.exportCollectionManabox).not.toHaveBeenCalled()
        })

        it('sends moxfield to the moxfield handler', async () => {
            const api = mockWindowApi()

            await exportCollection('moxfield', 'C:/tmp/out.csv')

            expect(api.exportCollectionMoxfield).toHaveBeenCalledWith('C:/tmp/out.csv')
            expect(api.exportCollection).not.toHaveBeenCalled()
            expect(api.exportCollectionManabox).not.toHaveBeenCalled()
        })

        it('sends manabox to the manabox handler', async () => {
            const api = mockWindowApi()

            await exportCollection('manabox', 'C:/tmp/out.csv')

            expect(api.exportCollectionManabox).toHaveBeenCalledWith('C:/tmp/out.csv')
            expect(api.exportCollection).not.toHaveBeenCalled()
            expect(api.exportCollectionMoxfield).not.toHaveBeenCalled()
        })

        it('returns the handler result untouched, including the row count', async () => {
            const api = mockWindowApi({
                exportCollectionMoxfield: vi.fn(async () => ({ exported: 42 })),
            })

            await expect(exportCollection('moxfield', 'C:/tmp/out.csv')).resolves.toEqual({ exported: 42 })
            expect(api.exportCollectionMoxfield).toHaveBeenCalledTimes(1)
        })
    })

    describe('error paths', () => {
        it('rejects a provider that has no export handler', async () => {
            // googleDrive is import-only in src/models/transfers.ts, so it falls
            // through the switch rather than reaching the bridge.
            const api = mockWindowApi()

            await expect(exportCollection('googleDrive', 'C:/tmp/out.csv')).resolves.toEqual({
                exported: 0,
                error: 'Invalid provider',
            })

            expect(api.exportCollection).not.toHaveBeenCalled()
            expect(api.exportCollectionMoxfield).not.toHaveBeenCalled()
            expect(api.exportCollectionManabox).not.toHaveBeenCalled()
        })

        it('rejects the invalid provider that getProviderByName falls back to', async () => {
            await expect(exportCollection('invalid', 'C:/tmp/out.csv')).resolves.toEqual({
                exported: 0,
                error: 'Invalid provider',
            })
        })

        it('passes a main-process failure through to the caller', async () => {
            // The handlers catch their own errors and return them in the result,
            // so this is the shape the UI actually has to render.
            mockWindowApi({
                exportCollectionManabox: vi.fn(async () => ({
                    exported: 0,
                    error: 'Error exporting collection to Manabox: ENOENT',
                })),
            })

            await expect(exportCollection('manabox', 'C:/nope/out.csv')).resolves.toEqual({
                exported: 0,
                error: 'Error exporting collection to Manabox: ENOENT',
            })
        })

        it('does not swallow a rejected IPC call', async () => {
            // Nothing catches here, so a broken IPC channel surfaces as a rejection
            // rather than an ExportResult. CollectionExport.tsx awaits this without
            // a try/catch, which would leave the button stuck on 'Exporting...'.
            mockWindowApi({
                exportCollection: vi.fn(async () => { throw new Error('channel closed') }),
            })

            await expect(exportCollection('blisterpod', 'C:/tmp/out.csv')).rejects.toThrow('channel closed')
        })
    })
})
