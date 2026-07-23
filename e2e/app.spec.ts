import { expect, test } from '@playwright/test'
import { launchApp, type LaunchedApp } from './setup/launch'

// Tier 4 smoke test: proves the built app boots against a throwaway profile,
// finds the seeded database, and renders.
test.describe('app launch', () => {
    let launched: LaunchedApp

    test.beforeAll(async () => {
        launched = await launchApp()
    })

    test.afterAll(async () => {
        await launched?.close()
    })

    test('opens a window titled Blisterpod Manager', async () => {
        expect(await launched.page.title()).toContain('Blisterpod Manager')
    })

    test('lands on the statistics route with the sidebar rendered', async () => {
        const { page } = launched

        await expect(page.getByRole('link', { name: 'Collection', exact: true })).toBeVisible()
        expect(page.url()).toContain('#/statistics')
    })

    test('shows the seeded collection', async () => {
        const { page } = launched

        await page.getByRole('link', { name: 'Collection', exact: true }).click()

        // The fixture holds three printings: GTC 54, BFZ 163, BFZ 184.
        await expect(page.getByText('Boros Reckoner')).toBeVisible()
    })
})
