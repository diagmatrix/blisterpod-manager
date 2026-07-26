/**
 * Reaches the DB logic that lives inside `ipcMain.handle(...)` closures.
 *
 * Every domain in `src/main/db/` exports only a `register*Handlers(db)` function;
 * the actual query bodies are anonymous callbacks with no other entry point.
 * The electron stub records those callbacks, and this harness replays them.
 *
 * Channel names are re-exported from the product code that defines them, so renaming
 * a channel breaks the tests at compile time rather than at run time.
 */
import type Database from 'better-sqlite3'
import { ipcHandlers, resetIpcHandlers } from './electron-stub'
import { resetLogRecords } from './electron-log-stub'

import { registerCardsHandlers } from '../../src/main/db/cards'
import { registerCollectionHandlers } from '../../src/main/db/collection'
import { registerDuplicateCardsHandlers } from '../../src/main/db/duplicates'
import { registerExportHandlers } from '../../src/main/db/export'
import { registerMissingCardsHandlers } from '../../src/main/db/missing'
import { registerStatsHandlers } from '../../src/main/db/stats'

export {
    CARDS_SEARCH_NAME, CARDS_DETAIL_NAME, CARDS_OTHERS_NAME,
    COLLECTION_LIST_NAME, COLLECTION_ADD_NAME, COLLECTION_ADD_BATCH_NAME,
    COLLECTION_UPDATE_NAME, COLLECTION_DELETE_NAME, COLLECTION_DELETE_MANY_NAME,
    DUPLICATES_LIST_NAME, DUPLICATES_IDS_NAME, DUPLICATES_MERGE_NAME,
    DUPLICATES_FULL_MERGE_NAME, DUPLICATES_DELETE_NAME,
    COLLECTION_EXPORT_NAME, COLLECTION_EXPORT_MOXFIELD_NAME, COLLECTION_EXPORT_MANABOX_NAME,
    MISSING_LIST_NAME, MISSING_FETCH_SET_NAME, MISSING_FETCH_SET_CARDS_NAME, MISSING_FETCH_CARD_NAME,
    STATS_SUMMARY_NAME, STATS_COLOR_DISTRIBUTION_NAME, STATS_RARITY_BREAKDOWN_NAME,
    STATS_TOP_VALUE_NAME, STATS_BY_SET_NAME,
} from '../../src/models/channels'

export interface IpcHarness {
    /**
     * Call a recorded handler. Note the handlers catch their own errors and log
     * them, so a failing query resolves with an empty result rather than throwing --
     * assert on the returned value, and use `loggedErrors()` to see what went wrong.
     */
    invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
    /** Every channel currently registered, for sanity-checking the wiring. */
    channels: () => string[]
}

/**
 * Registers all six DB domains against `db` and returns a way to call them.
 * Clears previously recorded handlers so registrations never leak between tests.
 */
export function registerDbHandlers(db: Database.Database): IpcHarness {
    resetIpcHandlers()
    resetLogRecords()

    registerCollectionHandlers(db)
    registerStatsHandlers(db)
    registerExportHandlers(db)
    registerCardsHandlers(db)
    registerMissingCardsHandlers(db)
    registerDuplicateCardsHandlers(db)

    return {
        invoke: async <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
            const handler = ipcHandlers.get(channel)
            if (!handler) {
                throw new Error(
                    `No handler registered for '${channel}'. Registered: ${[...ipcHandlers.keys()].join(', ')}`,
                )
            }
            // Handlers receive an IpcMainInvokeEvent they only use for `event.sender`,
            // which none of the DB domains touch.
            return await handler({}, ...args) as T
        },
        channels: () => [...ipcHandlers.keys()],
    }
}
