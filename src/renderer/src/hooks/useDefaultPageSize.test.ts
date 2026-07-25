import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockWindowApi } from '../../../../tests/renderer/window-api'
import { FALLBACK_PAGE_SIZE } from '../../../models/app'
import { useDefaultPageSize } from './useDefaultPageSize'

// Tier 3c smoke test: proves the typed `window.api` mock is installed and
// overridable per test.
describe('useDefaultPageSize', () => {
    it('adopts the configured page size', async () => {
        mockWindowApi({ settingsGet: (async () => 100) as never })

        const { result } = renderHook(() => useDefaultPageSize())

        await waitFor(() => expect(result.current).toBe(100))
    })

    it('falls back when the stored value is not a valid page size', async () => {
        mockWindowApi({ settingsGet: (async () => 7) as never })

        const { result } = renderHook(() => useDefaultPageSize())

        await waitFor(() => expect(result.current).toBe(FALLBACK_PAGE_SIZE))
    })
})
