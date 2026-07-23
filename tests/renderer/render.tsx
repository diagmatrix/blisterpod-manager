/**
 * `render` with the providers the real app mounts, so a component under test
 * sees the same context it does in production.
 *
 * Mirrors `src/renderer/src/main.tsx` (QueryClientProvider) and the top of
 * `src/renderer/src/App.tsx` (ThemeProvider, HashRouter). Routing is hash-based
 * and must stay that way -- see the router note in AGENTS.md.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
    /** Initial URL, e.g. `/card-detail/GTC/54`. */
    route?: string
    /** Route pattern to mount the element under, when it reads URL params. */
    path?: string
}

/**
 * A `QueryClient` per render with retries off -- a shared client would leak
 * cached results between tests, and retries turn an intended failure into a
 * multi-second timeout.
 */
function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
            mutations: { retry: false },
        },
    })
}

export function renderWithProviders(
    ui: ReactElement,
    { route = '/', path, ...options }: ProviderOptions = {},
): RenderResult & { queryClient: QueryClient } {
    const queryClient = createTestQueryClient()

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <ThemeProvider defaultTheme="light">
                    <MemoryRouter initialEntries={[route]}>
                        {path
                            ? <Routes><Route path={path} element={children} /></Routes>
                            : children}
                    </MemoryRouter>
                </ThemeProvider>
            </QueryClientProvider>
        )
    }

    return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient }
}

/**
 * `userEvent` wired to Vitest's fake timers. Needed by anything touching the
 * 1000ms debounce in `useCardFilters`; without `advanceTimers` the default
 * userEvent delay deadlocks against frozen time.
 */
export function setupUser(): ReturnType<typeof userEvent.setup> {
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
}

export * from '@testing-library/react'
