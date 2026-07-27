import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import type { UseCardSortReturn } from '../hooks/useCardSort'
import type { SortParams } from '../../../models/search'
import { CardSort } from './CardSort'

const OPTIONS = [{ value: 'value', label: 'Value' }]

const BUILT_IN_LABELS = ['Name', 'Set code', 'Collector number', 'Mana value']

/** `CardSort` is presentational: everything it does lands on one of these. */
function renderCardSort(sortParams: SortParams[] = []) {
    const sort: UseCardSortReturn = {
        sortParams,
        handleSort: vi.fn(),
        removeSort: vi.fn(),
        reset: vi.fn(),
    }
    const onCommit = vi.fn()
    renderWithProviders(<CardSort options={OPTIONS} sort={sort} onCommit={onCommit} />)

    return { sort, onCommit }
}

/** Lucide tags its icons with a class, which is the only mark the direction leaves in the DOM. */
function directionIconOf(label: string): string {
    return screen.getByRole('button', { name: label }).querySelector('svg')?.getAttribute('class') ?? ''
}

describe('<CardSort />', () => {
    it('offers the built-in columns before the ones the page adds', () => {
        renderCardSort()

        const labels = screen.getAllByRole('button').map((b) => b.textContent)

        expect(labels).toEqual(['Sort', 'Reset', ...BUILT_IN_LABELS, 'Value'])
    })

    it('leaves an unsorted column without an order or a direction', () => {
        renderCardSort()

        expect(screen.queryByRole('button', { name: 'Remove Value from sorting' })).not.toBeInTheDocument()
        expect(directionIconOf('Value')).toContain('lucide-minus')
    })

    it('shows the priority and the direction of every sorted column', () => {
        renderCardSort([
            { sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' },
            { sortColumn: 'name', sortOrder: 2, sortDirection: 'ASC' },
        ])

        expect(screen.getByRole('button', { name: 'Remove Value from sorting' })).toHaveTextContent('1')
        expect(directionIconOf('Value')).toContain('lucide-chevron-down')

        expect(screen.getByRole('button', { name: 'Remove Name from sorting' })).toHaveTextContent('2')
        expect(directionIconOf('Name')).toContain('lucide-chevron-up')
    })

    it('asks for a column when its pill is clicked, letting the hook pick the direction', () => {
        const { sort } = renderCardSort()

        screen.getByRole('button', { name: 'Value' }).click()

        expect(sort.handleSort).toHaveBeenCalledWith({ sortColumn: 'value' })
        expect(sort.removeSort).not.toHaveBeenCalled()
    })

    it('sends the same request for a column already in the chain', () => {
        const { sort } = renderCardSort([{ sortColumn: 'value', sortOrder: 1, sortDirection: 'ASC' }])

        screen.getByRole('button', { name: 'Value' }).click()

        expect(sort.handleSort).toHaveBeenCalledWith({ sortColumn: 'value' })
    })

    it('removes a column through its circle, without re-sorting it', () => {
        const { sort } = renderCardSort([{ sortColumn: 'value', sortOrder: 1, sortDirection: 'ASC' }])

        screen.getByRole('button', { name: 'Remove Value from sorting' }).click()

        expect(sort.removeSort).toHaveBeenCalledWith('value')
        expect(sort.handleSort).not.toHaveBeenCalled()
    })

    it('commits the chain as it stands', () => {
        const sortParams: SortParams[] = [{ sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' }]
        const { onCommit } = renderCardSort(sortParams)

        screen.getByRole('button', { name: 'Sort' }).click()

        expect(onCommit).toHaveBeenCalledWith(sortParams)
    })

    it('resets the chain without committing it', () => {
        const { sort, onCommit } = renderCardSort([{ sortColumn: 'value', sortOrder: 1, sortDirection: 'DESC' }])

        screen.getByRole('button', { name: 'Reset' }).click()

        expect(sort.reset).toHaveBeenCalledTimes(1)
        expect(onCommit).not.toHaveBeenCalled()
    })
})
