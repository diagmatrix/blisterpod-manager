import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../../../tests/renderer/render'
import { mockWindowApi } from '../../../../tests/renderer/window-api'
import AboutPage from './AboutPage'

describe('<AboutPage />', () => {
    it('renders each markdown section', async () => {
        mockWindowApi({ appVersion: async () => '1.0.5' })
        renderWithProviders(<AboutPage />)

        expect(await screen.findByText('Blisterpod Manager v1.0.5')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Attributions' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Disclaimers' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: 'Changelog' })).toBeInTheDocument()
    })

    it('shows the repository changelog, newest version first', async () => {
        renderWithProviders(<AboutPage />)

        const versions = (await screen.findAllByRole('heading', { level: 3 })).map(
            (heading) => heading.textContent
        )

        expect(versions[0]).toMatch(/^v\d+\.\d+\.\d+$/)
        expect(versions.length).toBeGreaterThan(1)
    })

    it('keeps the attribution links pointing outside the app', async () => {
        renderWithProviders(<AboutPage />)

        expect(await screen.findByRole('link', { name: 'Scryfall, LLC' })).toHaveAttribute(
            'href',
            'https://scryfall.com/'
        )
        expect(screen.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute(
            'href',
            'https://github.com/diagmatrix/blisterpod-manager'
        )
    })
})
