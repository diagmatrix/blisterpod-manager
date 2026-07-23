import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    // Each test launches a real Electron process against its own temp profile.
    // Running these in parallel buys little and makes failures hard to read.
    workers: 1,
    fullyParallel: false,
    timeout: 60_000,
    expect: { timeout: 15_000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
})
