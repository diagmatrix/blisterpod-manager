/**
 * Mock for the preload bridge the renderer talks to.
 *
 * Typed as the real `ElectronAPI` (declared in `src/renderer/src/env.d.ts` and
 * reachable here as `Window['api']`), so `npx tsc -b` fails whenever a method is
 * added to the preload bridge but not here. That is deliberate: it turns the
 * "IPC changes require synchronized edits in all layers" rule from AGENTS.md into
 * something the compiler enforces.
 */
import { vi } from 'vitest'
import type { AppSettings } from '../../src/models/app'

export type ElectronAPI = Window['api']

const emptyPage = { rows: [], total: 0 }

const DEFAULT_SETTINGS: AppSettings = {
    windowBounds: { width: 1280, height: 800, isMaximized: false },
    theme: 'light',
    defaultPageSize: 30,
    firstRun: false,
}

/**
 * Every method stubbed with a `vi.fn()` returning a benign empty result, so a
 * test only has to override the calls it actually cares about.
 */
export function defaultWindowApi(): ElectronAPI {
    return {
        // Cast keeps the `vi.fn()` spy identity while satisfying the generic
        // signature `ElectronAPI` declares for these two.
        settingsGet: vi.fn(async (key: keyof AppSettings) => DEFAULT_SETTINGS[key]) as ElectronAPI['settingsGet'],
        settingsSet: vi.fn(async () => {}) as ElectronAPI['settingsSet'],

        collectionList: vi.fn(async () => emptyPage),
        cardSearch: vi.fn(async () => emptyPage),
        cardDetail: vi.fn(async () => null),
        cardOtherPrintings: vi.fn(async () => emptyPage),

        collectionAdd: vi.fn(async () => ({ id: 1 })),
        collectionAddBatch: vi.fn(async () => ({ inserted: 0 })),
        collectionUpdate: vi.fn(async () => ({ success: true })),
        collectionDelete: vi.fn(async () => ({ success: true })),
        collectionDeleteMany: vi.fn(async () => ({ deleted: 0 })),

        statsSummary: vi.fn(async () => ({
            uniquePrintings: 0, uniqueNames: 0, totalCards: 0, estimatedValue: 0,
        })),
        statsColors: vi.fn(async () => ({
            white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0, multicolored: 0,
        })),
        statsRarity: vi.fn(async () => []),
        statsTopValue: vi.fn(async () => []),
        statsBySet: vi.fn(async () => []),

        duplicatesList: vi.fn(async () => []),
        duplicatesRows: vi.fn(async () => []),
        duplicatesMerge: vi.fn(async () => ({ success: true })),
        duplicatesMergeAll: vi.fn(async () => ({ merged: 0 })),
        duplicatesRemoveAll: vi.fn(async () => ({ deleted: 0 })),

        missingList: vi.fn(async () => []),
        missingFetchSet: vi.fn(async () => ({ success: true })),
        missingFetchCards: vi.fn(async () => ({ inserted: 0 })),
        missingFetchCard: vi.fn(async () => ({ success: true })),

        logMessage: vi.fn(),
        logPath: vi.fn(async () => 'C:/tmp/test.log'),
        dbPath: vi.fn(async () => 'C:/tmp/db.db'),

        refreshSetSymbols: vi.fn(async () => '1.0.0'),
        keyruneVersion: vi.fn(async () => ({ downloaded: '1.0.0' })),
        refreshManaSymbols: vi.fn(async () => {}),
        refreshSets: vi.fn(async () => ({ inserted: 0 })),
        refreshCards: vi.fn(async () => ({ inserted: 0 })),
        downloadCCMGFont: vi.fn(async () => {}),
        ccmgFontStatus: vi.fn(async () => ({ downloaded: true })),

        getAppIcon: vi.fn(async () => 'data:image/png;base64,'),
        appVersion: vi.fn(async () => '0.0.0-test'),
        restartApp: vi.fn(async () => {}),

        showSaveDialog: vi.fn(async () => null),
        exportCollection: vi.fn(async () => ({ exported: 0 })),
        exportCollectionMoxfield: vi.fn(async () => ({ exported: 0 })),
        exportCollectionManabox: vi.fn(async () => ({ exported: 0 })),
    }
}

/**
 * Install the mock on `window.api` for the current test and return it, so
 * assertions can be made against the individual `vi.fn()`s.
 */
export function mockWindowApi(overrides: Partial<ElectronAPI> = {}): ElectronAPI {
    const api = { ...defaultWindowApi(), ...overrides }
    window.api = api
    return api
}
