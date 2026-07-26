import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../../tests/renderer/render'
import { mockWindowApi, type ElectronAPI } from '../../../../tests/renderer/window-api'
import type { SortParams } from '../../../models/search'
import AddCardPage, { DEFAULT_SORT } from './AddCardPage'

/** Real time has to pass for the 1000ms filter debounce plus the 500ms search one. */
const DEBOUNCES_MS = 4000

/** The page-level button, told apart from the one `CardSort` renders by its tooltip. */
const PAGE_RESET = 'Reset filters and sort'

/** A column the default chain leaves out, so its pill appends rather than flips. */
const UNSORTED_LABEL = 'Rarity'
const UNSORTED_COLUMN = 'rarity'

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

        expect(sortOfCall(api, 0)).toEqual(DEFAULT_SORT)
    })

    it('leaves the search alone until the pending chain is committed', async () => {
        await renderPageAndSearch()
        const defaultSort = sortOfCall(api, 0) ?? []

        await user.click(screen.getByRole('button', { name: UNSORTED_LABEL }))

        expect(screen.getByRole('button', { name: `Remove ${UNSORTED_LABEL} from sorting` }))
            .toHaveTextContent(String(defaultSort.length + 1))
        expect(api.cardSearch).toHaveBeenCalledTimes(1)

        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.cardSearch).toHaveBeenCalledTimes(2))
        expect(lastSort(api)).toEqual([
            ...defaultSort,
            { sortColumn: UNSORTED_COLUMN, sortOrder: defaultSort.length + 1, sortDirection: 'ASC' },
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

        const [first, ...rest] = DEFAULT_SORT

        await user.click(screen.getByRole('button', { name: 'Remove Name from sorting' }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))

        await waitFor(() => expect(api.cardSearch).toHaveBeenCalledTimes(2))
        // Dropping the head of the chain promotes everything behind it.
        expect(first.sortColumn).toBe('name')
        expect(lastSort(api)).toEqual(rest.map((params, i) => ({ ...params, sortOrder: i + 1 })))
    })

    it('clears the search and the committed sort when the page is reset', async () => {
        await renderPageAndSearch()

        await user.click(screen.getByRole('button', { name: UNSORTED_LABEL }))
        await user.click(screen.getByRole('button', { name: 'Sort' }))
        await waitFor(() => expect(lastSort(api)).toEqual([
            ...DEFAULT_SORT,
            { sortColumn: UNSORTED_COLUMN, sortOrder: DEFAULT_SORT.length + 1, sortDirection: 'ASC' },
        ]))

        await user.click(screen.getByTitle(PAGE_RESET))

        expect(screen.getByPlaceholderText('Card name ...')).toHaveValue('')
        expect(screen.queryByRole('button', { name: `Remove ${UNSORTED_LABEL} from sorting` })).not.toBeInTheDocument()

        // The search only runs again once a filter narrows it, and it comes back with the default chain.
        await user.type(screen.getByPlaceholderText('Card name ...'), 'Jace')
        await waitFor(() => expect(lastSort(api)).toEqual(DEFAULT_SORT), { timeout: DEBOUNCES_MS })
    })
})
