import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../../tests/renderer/render'
import { mockWindowApi, type ElectronAPI } from '../../../../tests/renderer/window-api'
import type { SortParams } from '../../../models/search'
import AddCardPage from './AddCardPage'

/** Real time has to pass for the 1000ms filter debounce plus the 500ms search one. */
const DEBOUNCES_MS = 4000

function sortOfCall(api: ElectronAPI, index: number): SortParams[] | undefined {
    return vi.mocked(api.cardSearch).mock.calls[index][0].sort
}

function lastSort(api: ElectronAPI): SortParams[] | undefined {
    return vi.mocked(api.cardSearch).mock.lastCall?.[0].sort
}

describe('<AddCardPage />', () => {
    let api: ElectronAPI
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
        api = mockWindowApi()
        user = userEvent.setup()
    })

    /** The search only runs once a name or set narrows it, so every case starts here. */
    async function renderPageAndSearch() {
        renderWithProviders(<AddCardPage />)
        await user.type(screen.getByPlaceholderText('Card name ...'), 'Jace')

        await waitFor(() => expect(api.cardSearch).toHaveBeenCalledTimes(1), { timeout: DEBOUNCES_MS })
    }

    it('searches with the default sort chain', async () => {
        await renderPageAndSearch()

        expect(sortOfCall(api, 0)).toEqual([
            { sortColumn: 'set_code', sortOrder: 1, sortDirection: 'ASC' },
            { sortColumn: 'collector_number_normalised', sortOrder: 2, sortDirection: 'ASC' },
        ])
    })

    it('leaves the search alone until the pending chain is committed', async () => {
        await renderPageAndSearch()
        const defaultSort = sortOfCall(api, 0) ?? []

        await user.click(screen.getByRole('button', { name: 'Name' }))

        expect(screen.getByRole('button', { name: 'Remove Name from sorting' }))
            .toHaveTextContent(String(defaultSort.length + 1))
        expect(api.cardSearch).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.cardSearch).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([
            ...defaultSort,
            { sortColumn: 'name', sortOrder: defaultSort.length + 1, sortDirection: 'ASC' },
        ])
    })

    it('sends the search back to the first page when a sort is committed', async () => {
        // A total without rows is enough to get the pager on screen, and keeps the
        // image grid (and its card fixtures) out of a test about query params.
        api = mockWindowApi({ cardSearch: vi.fn(async () => ({ rows: [], total: 100 })) })
        await renderPageAndSearch()

        // Awaited: the pager only appears once the first result has rendered.
        await user.click(await screen.findByRole('button', { name: '>' }))
        await waitFor(() => expect(vi.mocked(api.cardSearch).mock.lastCall?.[0].page).toBe(2))

        await user.click(screen.getByRole('button', { name: 'Name' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(vi.mocked(api.cardSearch).mock.lastCall?.[0].page).toBe(1))
    })

    it('drops a column from the chain and commits the rest', async () => {
        await renderPageAndSearch()

        await user.click(screen.getByRole('button', { name: 'Remove Set code from sorting' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.cardSearch).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([
            { sortColumn: 'collector_number_normalised', sortOrder: 1, sortDirection: 'ASC' },
        ])
    })
})
