import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import { mockWindowApi, type ElectronAPI } from '../../../../tests/renderer/window-api'
import { CollectionExport } from './CollectionExport'

const SAVE_PATH = 'C:/tmp/blisterpod_collection.csv'

describe('<CollectionExport />', () => {
    let api: ElectronAPI
    let user: ReturnType<typeof userEvent.setup>

    // Radix' Select drives its trigger through the Pointer Events API, which jsdom
    // does not implement at all.
    beforeAll(() => {
        Element.prototype.hasPointerCapture ??= () => false
        Element.prototype.setPointerCapture ??= () => {}
        Element.prototype.releasePointerCapture ??= () => {}
        Element.prototype.scrollIntoView ??= () => {}
    })

    beforeEach(() => {
        api = mockWindowApi()
        user = userEvent.setup()
    })

    function pathInput() {
        return screen.getByPlaceholderText('Save path...')
    }

    it('cannot export before a path is chosen', () => {
        renderWithProviders(<CollectionExport />)

        expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })

    it('takes the path from the native dialog, named after the provider', async () => {
        api = mockWindowApi({ showSaveDialog: vi.fn(async () => SAVE_PATH) })
        renderWithProviders(<CollectionExport />)

        await user.click(screen.getByRole('button', { name: 'Browse...' }))

        expect(api.showSaveDialog).toHaveBeenCalledWith('blisterpod_collection.csv')
        expect(pathInput()).toHaveValue(SAVE_PATH)
        expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled()
    })

    it('keeps the form untouched when the dialog is cancelled', async () => {
        api = mockWindowApi({ showSaveDialog: vi.fn(async () => null) })
        renderWithProviders(<CollectionExport />)

        await user.click(screen.getByRole('button', { name: 'Browse...' }))

        expect(pathInput()).toHaveValue('')
        expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
    })

    it('exports to the typed path and reports the row count', async () => {
        api = mockWindowApi({ exportCollection: vi.fn(async () => ({ exported: 12 })) })
        renderWithProviders(<CollectionExport />)

        await user.type(pathInput(), SAVE_PATH)
        await user.click(screen.getByRole('button', { name: 'Export' }))

        expect(api.exportCollection).toHaveBeenCalledWith(SAVE_PATH)
        expect(await screen.findByText('12 rows exported')).toBeInTheDocument()
        // The path is consumed, so the same file is not overwritten by a stray second click.
        expect(pathInput()).toHaveValue('')
    })

    it('routes to the handler of the provider that is picked', async () => {
        renderWithProviders(<CollectionExport />)

        await user.click(screen.getByRole('combobox'))
        await user.click(await screen.findByRole('option', { name: 'Moxfield' }))

        await user.type(pathInput(), SAVE_PATH)
        await user.click(screen.getByRole('button', { name: 'Export' }))

        expect(api.exportCollectionMoxfield).toHaveBeenCalledWith(SAVE_PATH)
        expect(api.exportCollection).not.toHaveBeenCalled()
    })

    it('puts a failure behind the errors dialog', async () => {
        api = mockWindowApi({
            exportCollection: vi.fn(async () => ({ exported: 0, error: 'Error exporting collection: ENOENT. Nothing was written' })),
        })
        renderWithProviders(<CollectionExport />)

        await user.type(pathInput(), SAVE_PATH)
        await user.click(screen.getByRole('button', { name: 'Export' }))

        // A regex, because the count sits in the same span as the ' - show errors' link.
        expect(await screen.findByText(/0 rows exported/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'show errors' }))

        expect(screen.getByText('Export errors')).toBeInTheDocument()
        expect(screen.getByText('Error exporting collection: ENOENT')).toBeInTheDocument()
        expect(screen.getByText('Nothing was written')).toBeInTheDocument()
    })
})
