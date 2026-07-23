import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import { Pagination } from './Pagination'

// Tier 3b smoke test: proves jsdom, the React plugin, testing-library and the
// providers wrapper are all wired up.
describe('<Pagination />', () => {
    const props = {
        page: 2,
        pageSize: 30,
        total: 95,
        pageSizes: [30, 60, 120] as const,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
    }

    it('renders the current range and page count', () => {
        renderWithProviders(<Pagination {...props} />)

        expect(screen.getByText('31–60 of 95')).toBeInTheDocument()
        expect(screen.getByText('2 / 4')).toBeInTheDocument()
    })

    it('reports the page size the user picks', async () => {
        const onPageSizeChange = vi.fn()
        renderWithProviders(<Pagination {...props} onPageSizeChange={onPageSizeChange} />)

        screen.getByRole('button', { name: '120' }).click()

        expect(onPageSizeChange).toHaveBeenCalledWith(120)
    })
})
