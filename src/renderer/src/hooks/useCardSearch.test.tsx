import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockWindowApi } from '../../../../tests/renderer/window-api'
import type { ScryfallCard } from '../../../models/cards'
import type { CardSearchParams, SortParams } from '../../../models/search'
import { useCardSearch } from './useCardSearch'

const VALUE_DESC: SortParams[] = [{ sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' }]
const NAME_ASC: SortParams[] = [{ sortColumn: 'name', sortOrder: 1, sortDirection: 'ASC' }]

const NO_FILTER: CardSearchParams = { page: 1, pageSize: 30, sort: VALUE_DESC }
const FILTERED: CardSearchParams = { ...NO_FILTER, cardName: 'Jace' }

/** A client per test: a shared one would replay cached results across cases. */
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
}

function renderCardSearch(initialProps: CardSearchParams) {
    return renderHook((params: CardSearchParams) => useCardSearch(params), {
        wrapper: createWrapper(),
        initialProps,
    })
}

/**
 * Runs the timers and lets the resulting query settle, without leaving fake time.
 * The second flush costs no time and exists because react-query batches the render
 * that follows a resolved query onto its own `setTimeout(0)`.
 */
async function advance(ms: number) {
    await act(async () => { vi.advanceTimersByTime(ms) })
    await act(async () => { vi.advanceTimersByTime(0) })
}

describe('useCardSearch', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('stays idle until a filter narrows the search', async () => {
        const api = mockWindowApi()

        const { result } = renderCardSearch(NO_FILTER)
        await advance(2000)

        expect(api.cardSearch).not.toHaveBeenCalled()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.rows).toEqual([])
    })

    it('waits out the debounce before a filter change reaches the query', async () => {
        const api = mockWindowApi()

        const { rerender } = renderCardSearch(NO_FILTER)
        rerender(FILTERED)

        await advance(400)
        expect(api.cardSearch).not.toHaveBeenCalled()

        await advance(200)
        expect(api.cardSearch).toHaveBeenCalledWith(expect.objectContaining({ cardName: 'Jace' }))
    })

    it('sends a sort change straight through, without the filter debounce', async () => {
        const api = mockWindowApi()

        const { rerender } = renderCardSearch(FILTERED)
        await advance(0)
        expect(api.cardSearch).toHaveBeenCalledTimes(1)
        expect(api.cardSearch).toHaveBeenLastCalledWith(expect.objectContaining({ sort: VALUE_DESC }))

        rerender({ ...FILTERED, sort: NAME_ASC })
        await advance(0)

        expect(api.cardSearch).toHaveBeenCalledTimes(2)
        expect(api.cardSearch).toHaveBeenLastCalledWith(expect.objectContaining({ sort: NAME_ASC }))
    })

    it('sends a page change straight through as well', async () => {
        const api = mockWindowApi()

        const { rerender } = renderCardSearch(FILTERED)
        await advance(0)

        rerender({ ...FILTERED, page: 2 })
        await advance(0)

        expect(api.cardSearch).toHaveBeenCalledTimes(2)
        expect(api.cardSearch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    })

    it('returns the rows and the total of the committed query', async () => {
        const rows = [{ name: 'Jace Beleren' } as ScryfallCard]
        mockWindowApi({ cardSearch: vi.fn(async () => ({ rows, total: 1 })) })

        const { result } = renderCardSearch(FILTERED)
        await advance(0)

        expect(result.current.rows).toEqual(rows)
        expect(result.current.total).toBe(1)
        expect(result.current.isLoading).toBe(false)
    })
})
