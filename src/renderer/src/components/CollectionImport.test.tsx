import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import { mockWindowApi, type ElectronAPI } from '../../../../tests/renderer/window-api'
import { CollectionImport } from './CollectionImport'

const BLISTERPOD_CSV = [
    'set_code,collector_number,quantity_nonfoil,quantity_foil',
    'GTC,54,2,1',
    'BFZ,163,1,0',
].join('\n')

const GTC = { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 2, quantityFoil: 1, createdAt: undefined, updatedAt: undefined }
const BFZ = { setCode: 'BFZ', collectorNumber: '163', quantityNonfoil: 1, quantityFoil: 0, createdAt: undefined, updatedAt: undefined }

function csvFile(contents: string) {
    return new File([contents], 'collection.csv', { type: 'text/csv' })
}

describe('<CollectionImport />', () => {
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

    function fileInput(): HTMLInputElement {
        return screen.getByLabelText('Choose file...')
    }

    it('sends the parsed rows to the collection and reports how many landed', async () => {
        api = mockWindowApi({ collectionAddBatch: vi.fn(async () => ({ inserted: 3 })) })
        renderWithProviders(<CollectionImport />)

        await user.upload(fileInput(), csvFile(BLISTERPOD_CSV))

        expect(api.collectionAddBatch).toHaveBeenCalledWith([GTC, BFZ])
        expect(await screen.findByText('3 imported')).toBeInTheDocument()
    })

    it('parses with the provider that is picked', async () => {
        const moxfieldCsv = [
            '"Count","Edition","Collector Number","Foil"',
            '"2","gtc","54","true"',
        ].join('\n')
        renderWithProviders(<CollectionImport />)

        await user.click(screen.getByRole('combobox'))
        await user.click(await screen.findByRole('option', { name: 'Moxfield' }))
        await user.upload(fileInput(), csvFile(moxfieldCsv))

        expect(api.collectionAddBatch).toHaveBeenCalledWith([
            { setCode: 'GTC', collectorNumber: '54', quantityNonfoil: 0, quantityFoil: 2 },
        ])
    })

    it('imports what it can and puts the rejected rows behind the errors dialog', async () => {
        const csv = [
            'set_code,collector_number,quantity_nonfoil,quantity_foil',
            'GTC,54,0,0',
            ',163,1,0',
            'BFZ,163,1,0',
        ].join('\n')
        api = mockWindowApi({ collectionAddBatch: vi.fn(async () => ({ inserted: 1 })) })
        renderWithProviders(<CollectionImport />)

        await user.upload(fileInput(), csvFile(csv))

        expect(api.collectionAddBatch).toHaveBeenCalledWith([BFZ])
        expect(await screen.findByText(/1 imported/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'show errors' }))

        expect(screen.getByText('Import errors')).toBeInTheDocument()
        expect(screen.getByText('1 rows were not imported due to missing the set code')).toBeInTheDocument()
        expect(screen.getByText('1 rows were not imported due to invalid quantity values')).toBeInTheDocument()
    })

    it('joins a parsing error and an insert error into the same dialog', async () => {
        api = mockWindowApi({
            collectionAddBatch: vi.fn(async () => ({ inserted: 0, error: 'Error adding cards to collection' })),
        })
        renderWithProviders(<CollectionImport />)

        await user.upload(fileInput(), csvFile('foo,bar\n1,2'))

        expect(await screen.findByText(/0 imported/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'show errors' }))

        expect(screen.getByText('Missing set_code and/or collector_number columns')).toBeInTheDocument()
        expect(screen.getByText('Error adding cards to collection')).toBeInTheDocument()
    })

    it('clears the picker so the same file can be imported twice', async () => {
        renderWithProviders(<CollectionImport />)

        await user.upload(fileInput(), csvFile(BLISTERPOD_CSV))

        expect(fileInput().value).toBe('')
        expect(api.collectionAddBatch).toHaveBeenCalledTimes(1)

        await user.upload(fileInput(), csvFile(BLISTERPOD_CSV))

        expect(api.collectionAddBatch).toHaveBeenCalledTimes(2)
    })
})
