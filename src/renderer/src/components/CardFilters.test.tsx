import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import { useCardFilters } from '../hooks/useCardFilters'
import { CardFilters } from './CardFilters'

const CARD_TYPE_BOX = 'Card type ...'

/**
 * `CardFilters` is presentational, so it is driven by the real hook here: the point of
 * these cases is what does and does not reach the committed filters.
 */
function renderCardFilters() {
    function Harness() {
        const { filtersState, filtersHandlers, commit, searchCardName, cardTypes, rarities } = useCardFilters()

        return (
            <>
                <CardFilters state={filtersState} handlers={filtersHandlers} onCommit={commit} />
                <output data-testid="committed">{JSON.stringify({ searchCardName, cardTypes, rarities })}</output>
            </>
        )
    }

    renderWithProviders(<Harness />)

    return {
        user: userEvent.setup(),
        committed: () => JSON.parse(screen.getByTestId('committed').textContent ?? '{}'),
    }
}

function chipNames(): string[] {
    return screen.queryAllByRole('button', { name: /^Remove .* type$/ }).map((b) => b.getAttribute('aria-label') ?? '')
}

describe('<CardFilters />', () => {
    describe('card type chips', () => {
        it('turns what was typed into a chip on Enter and empties the box', async () => {
            const { user } = renderCardFilters()

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Creature{Enter}')

            expect(screen.getByRole('button', { name: 'Remove creature type' })).toBeInTheDocument()
            expect(screen.getByPlaceholderText(CARD_TYPE_BOX)).toHaveValue('')
        })

        it('keeps every chip that is entered, in order', async () => {
            const { user } = renderCardFilters()

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Legendary{Enter}Creature{Enter}')

            expect(chipNames()).toEqual(['Remove legendary type', 'Remove creature type'])
        })

        it('folds a repeat that differs only in case into the existing chip', async () => {
            const { user } = renderCardFilters()

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Creature{Enter}creature{Enter}')

            expect(chipNames()).toEqual(['Remove creature type'])
        })

        it('adds nothing for a blank entry', async () => {
            const { user } = renderCardFilters()

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), '   {Enter}')

            expect(chipNames()).toEqual([])
        })

        it('drops a chip through its X', async () => {
            const { user } = renderCardFilters()
            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Elf{Enter}Druid{Enter}')

            await user.click(screen.getByRole('button', { name: 'Remove elf type' }))

            expect(chipNames()).toEqual(['Remove druid type'])
        })

        it('backspaces the last chip away when the box is already empty', async () => {
            const { user } = renderCardFilters()
            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Elf{Enter}Druid{Enter}')

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), '{Backspace}')

            expect(chipNames()).toEqual(['Remove elf type'])
        })
    })

    describe('committing', () => {
        it('holds every filter back until Filter is pressed', async () => {
            const { user, committed } = renderCardFilters()

            await user.type(screen.getByPlaceholderText('Card name ...'), 'Jace')
            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Creature{Enter}')
            await user.click(screen.getByRole('button', { name: 'Mythic' }))

            expect(committed()).toEqual({ searchCardName: '', cardTypes: [], rarities: [] })

            await user.click(screen.getByRole('button', { name: 'Filter' }))

            expect(committed()).toEqual({ searchCardName: 'Jace', cardTypes: ['creature'], rarities: ['mythic'] })
        })

        it('commits from the name box on Enter', async () => {
            const { user, committed } = renderCardFilters()

            await user.type(screen.getByPlaceholderText('Card name ...'), 'Jace{Enter}')

            expect(committed().searchCardName).toBe('Jace')
        })

        it('commits from the card type box on Enter once there is nothing left to add', async () => {
            const { user, committed } = renderCardFilters()

            // The first Enter banks the chip; only the second one, on an empty box, searches.
            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), 'Creature{Enter}')
            expect(committed().cardTypes).toEqual([])

            await user.type(screen.getByPlaceholderText(CARD_TYPE_BOX), '{Enter}')
            expect(committed().cardTypes).toEqual(['creature'])
        })

        it('leaves a name too short to search out of the committed filters', async () => {
            const { user, committed } = renderCardFilters()

            await user.type(screen.getByPlaceholderText('Card name ...'), 'Ja')
            await user.click(screen.getByRole('button', { name: 'Filter' }))

            expect(committed().searchCardName).toBe('')
        })
    })
})
