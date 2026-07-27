import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../../tests/renderer/render'
import { mockWindowApi, type ElectronAPI } from '../../../../tests/renderer/window-api'
import type { SortParams } from '../../../models/search'
import CollectionPage, { DEFAULT_SORT } from './CollectionPage'

const TOTAL_ASC: SortParams = { sortColumn: 'total', sortOrder: 2, sortDirection: 'ASC' }

/** The page-level button, told apart from the one `CardSort` renders by its tooltip. */
const PAGE_RESET = 'Reset filters and sort'
const PENDING_RESET = 'Restore the default sorting'

function lastSort(api: ElectronAPI): SortParams[] | undefined {
    const calls = vi.mocked(api.collectionList).mock.calls
    return calls[calls.length - 1][0].sort
}

describe('<CollectionPage />', () => {
    let api: ElectronAPI
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
        api = mockWindowApi()
        user = userEvent.setup()
    })

    async function renderPage() {
        renderWithProviders(<CollectionPage />)
        await waitFor(() => expect(api.collectionList).toHaveBeenCalledTimes(1))
    }

    it('queries with the default sort on mount', async () => {
        await renderPage()

        expect(lastSort(api)).toEqual(DEFAULT_SORT)
        expect(screen.getByRole('button', { name: 'Remove Value from sorting' })).toHaveTextContent('1')
    })

    it('keeps the pending chain out of the query until Sort is pressed', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Total' }))

        expect(screen.getByRole('button', { name: 'Remove Total from sorting' })).toHaveTextContent('2')
        expect(api.collectionList).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.collectionList).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([...DEFAULT_SORT, TOTAL_ASC])
    })

    it('commits a flipped direction for a column already in the chain', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Value' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.collectionList).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([{ sortColumn: 'value', sortOrder: 1, sortDirection: 'ASC' }])
    })

    it('commits a chain a column was removed from', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Total' }))
        await user.click(screen.getByRole('button', { name: 'Remove Value from sorting' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.collectionList).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([{ sortColumn: 'total', sortOrder: 1, sortDirection: 'ASC' }])
    })

    it('cannot commit an empty chain', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Remove Value from sorting' }))

        expect(screen.getByRole('button', { name: 'Sort' })).toBeDisabled()
        expect(api.collectionList).toHaveBeenCalledTimes(1)
    })

    it('restores the pending chain without requerying when the sort section is reset', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Total' }))
        await user.click(screen.getByTitle(PENDING_RESET))

        expect(screen.queryByRole('button', { name: 'Remove Total from sorting' })).not.toBeInTheDocument()
        expect(api.collectionList).toHaveBeenCalledTimes(1)
    })

    it('puts the committed sort back to the default when the page is reset', async () => {
        await renderPage()

        await user.click(screen.getByRole('button', { name: 'Total' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))
        await waitFor(() => expect(lastSort(api)).toEqual([...DEFAULT_SORT, TOTAL_ASC]))

        await user.click(screen.getByTitle(PAGE_RESET))

        await waitFor(() => expect(lastSort(api)).toEqual(DEFAULT_SORT))
        expect(screen.queryByRole('button', { name: 'Remove Total from sorting' })).not.toBeInTheDocument()
    })
})
