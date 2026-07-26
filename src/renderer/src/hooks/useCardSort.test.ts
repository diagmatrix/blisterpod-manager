import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SortParams } from '../../../models/search'
import { useCardSort } from './useCardSort'

const VALUE_DESC: SortParams = { sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' }

describe('useCardSort', () => {
    describe('defaults', () => {
        it('starts empty when no default is given', () => {
            const { result } = renderHook(() => useCardSort())

            expect(result.current.sortParams).toEqual([])
        })

        it('prioritises the defaults, sends the ones without an order last and drops duplicates', () => {
            const { result } = renderHook(() => useCardSort([
                { sortColumn: 'name' },
                { sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' },
                { sortColumn: 'value', sortOrder: 2, sortDirection: 'ASC' },
            ]))

            expect(result.current.sortParams).toEqual([
                VALUE_DESC,
                { sortColumn: 'name', sortOrder: 2, sortDirection: 'ASC' },
            ])
        })
    })

    describe('handleSort', () => {
        it('appends an unsorted column as ascending', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC]))

            act(() => result.current.handleSort({ sortColumn: 'name' }))

            expect(result.current.sortParams).toEqual([
                VALUE_DESC,
                { sortColumn: 'name', sortOrder: 2, sortDirection: 'ASC' },
            ])
        })

        it('flips the direction of a sorted column, keeping its priority', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC, { sortColumn: 'name' }]))

            act(() => result.current.handleSort({ sortColumn: 'value' }))

            expect(result.current.sortParams).toEqual([
                { sortColumn: 'value', sortOrder: 1, sortDirection: 'ASC' },
                { sortColumn: 'name', sortOrder: 2, sortDirection: 'ASC' },
            ])
        })

        it('takes an explicit direction instead of flipping', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC]))

            act(() => result.current.handleSort({ sortColumn: 'value', sortDirection: 'DESC' }))

            expect(result.current.sortParams).toEqual([VALUE_DESC])
        })

        it('moves a column to an explicit priority, pushing the rest back', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC, { sortColumn: 'name' }]))

            act(() => result.current.handleSort({ sortColumn: 'rarity', sortOrder: 1 }))

            expect(result.current.sortParams).toEqual([
                { sortColumn: 'rarity', sortOrder: 1, sortDirection: 'ASC' },
                { sortColumn: 'value', sortOrder: 2, sortDirection: 'DESC' },
                { sortColumn: 'name', sortOrder: 3, sortDirection: 'ASC' },
            ])
        })

        it('clamps a priority beyond the chain to its end', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC]))

            act(() => result.current.handleSort({ sortColumn: 'name', sortOrder: 99 }))

            expect(result.current.sortParams).toEqual([
                VALUE_DESC,
                { sortColumn: 'name', sortOrder: 2, sortDirection: 'ASC' },
            ])
        })
    })

    describe('removeSort', () => {
        it('drops a column and renumbers the remaining ones', () => {
            const { result } = renderHook(() => useCardSort([
                { sortColumn: 'value', sortDirection: 'DESC' },
                { sortColumn: 'name' },
                { sortColumn: 'rarity' },
            ]))

            act(() => result.current.removeSort('name'))

            expect(result.current.sortParams).toEqual([
                VALUE_DESC,
                { sortColumn: 'rarity', sortOrder: 2, sortDirection: 'ASC' },
            ])
        })

        it('ignores a column that is not sorted', () => {
            const { result } = renderHook(() => useCardSort([VALUE_DESC]))

            act(() => result.current.removeSort('name'))

            expect(result.current.sortParams).toEqual([VALUE_DESC])
        })
    })

    it('resets back to the defaults', () => {
        const { result } = renderHook(() => useCardSort([VALUE_DESC]))

        act(() => {
            result.current.handleSort({ sortColumn: 'name' })
            result.current.removeSort('value')
        })
        expect(result.current.sortParams).toEqual([{ sortColumn: 'name', sortOrder: 1, sortDirection: 'ASC' }])

        act(() => result.current.reset())

        expect(result.current.sortParams).toEqual([VALUE_DESC])
    })

    it('keeps the defaults captured on mount, so callers can pass them inline', () => {
        const { result, rerender } = renderHook(() => useCardSort([{ sortColumn: 'value', sortDirection: 'DESC' }]))

        act(() => result.current.handleSort({ sortColumn: 'name' }))
        const reset = result.current.reset
        rerender()

        expect(result.current.reset).toBe(reset)
        expect(result.current.sortParams).toHaveLength(2)
    })
})
