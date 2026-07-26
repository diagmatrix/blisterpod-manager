import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Markdown, parseMarkdown } from './Markdown'

describe('parseMarkdown', () => {
    it('groups wrapped lines into one paragraph and consecutive dashes into one list', () => {
        const blocks = parseMarkdown(
            ['A sentence that', 'wraps across lines.', '', '- first', '- second', '', 'Tail.'].join(
                '\n'
            )
        )

        expect(blocks).toEqual([
            { kind: 'paragraph', text: 'A sentence that wraps across lines.' },
            { kind: 'list', items: ['first', 'second'] },
            { kind: 'paragraph', text: 'Tail.' },
        ])
    })

    it('reads heading depth from the number of hashes', () => {
        expect(parseMarkdown('# One\n\n### Three')).toEqual([
            { kind: 'heading', level: 1, text: 'One' },
            { kind: 'heading', level: 3, text: 'Three' },
        ])
    })

    it('folds a wrapped list item back into the item it belongs to', () => {
        expect(parseMarkdown('- an item that\n  wraps')).toEqual([
            { kind: 'list', items: ['an item that wraps'] },
        ])
    })
})

describe('<Markdown />', () => {
    it('renders links as external anchors', () => {
        render(<Markdown source="See [Scryfall](https://scryfall.com/) for data." />)

        const link = screen.getByRole('link', { name: 'Scryfall' })
        expect(link).toHaveAttribute('href', 'https://scryfall.com/')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noreferrer')
    })

    it('renders bold and inline code within a list item', () => {
        render(<Markdown source="- **Bold bit** — run `npm test`" />)

        const item = screen.getByRole('listitem')
        expect(within(item).getByText('Bold bit').tagName).toBe('STRONG')
        expect(within(item).getByText('npm test').tagName).toBe('CODE')
    })

    it('demotes headings by the heading offset', () => {
        render(<Markdown source={'# Changelog\n\n## v1.0.4'} headingOffset={1} />)

        expect(screen.getByRole('heading', { level: 2, name: 'Changelog' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'v1.0.4' })).toBeInTheDocument()
    })

    it('leaves unsupported syntax as literal text rather than dropping it', () => {
        render(<Markdown source="A | table | row" />)

        expect(screen.getByText('A | table | row')).toBeInTheDocument()
    })
})
