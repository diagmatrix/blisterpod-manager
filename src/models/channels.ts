/**
 * IPC channel names, shared by the main process and the preload script.
 *
 * These live here, and not next to the handlers, because the preload bundle must
 * not import main-process modules. Keep this file free of imports and side effects.
 */

// Database
export const DIALOG_SHOW_SAVE_NAME = 'dialog:showSaveDialog'
export const DB_PATH_NAME = 'db:path'

// Collection
export const COLLECTION_LIST_NAME = 'collection:list'
export const COLLECTION_ADD_NAME = 'collection:add'
export const COLLECTION_ADD_BATCH_NAME = 'collection:add-batch'
export const COLLECTION_UPDATE_NAME = 'collection:update'
export const COLLECTION_DELETE_NAME = 'collection:delete'
export const COLLECTION_DELETE_MANY_NAME = 'collection:delete-many'

// Cards
export const CARDS_SEARCH_NAME = 'cards:search'
export const CARDS_DETAIL_NAME = 'cards:detail'
export const CARDS_OTHERS_NAME = 'cards:other-printings'

// Stats
export const STATS_SUMMARY_NAME = 'stats:summary'
export const STATS_COLOR_DISTRIBUTION_NAME = 'stats:colors'
export const STATS_RARITY_BREAKDOWN_NAME = 'stats:rarity'
export const STATS_TOP_VALUE_NAME = 'stats:top-value'
export const STATS_BY_SET_NAME = 'stats:by-set'

// Duplicates
export const DUPLICATES_LIST_NAME = 'duplicates:list'
export const DUPLICATES_IDS_NAME = 'duplicates:ids'
export const DUPLICATES_MERGE_NAME = 'duplicates:merge'
export const DUPLICATES_FULL_MERGE_NAME = 'duplicates:merge-all'
export const DUPLICATES_DELETE_NAME = 'duplicates:remove-all'

// Missing cards
export const MISSING_LIST_NAME = 'missing:list'
export const MISSING_FETCH_SET_NAME = 'missing:fetch-set'
export const MISSING_FETCH_SET_CARDS_NAME = 'missing:fetch-cards'
export const MISSING_FETCH_CARD_NAME = 'missing:fetch-card'

// Export
export const COLLECTION_EXPORT_NAME = 'collection:export'
export const COLLECTION_EXPORT_MOXFIELD_NAME = 'collection:export-moxfield'
export const COLLECTION_EXPORT_MANABOX_NAME = 'collection:export-manabox'
