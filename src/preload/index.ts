import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, LogEntry, KeyruneVersion } from '../models/app'
import type { CollectionCard, MissingCard, DuplicateCard, DuplicateCardInstance, CardDetail, ScryfallCard } from '../models/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../models/stats'
import type {
    CardSearchParams,
    CardDetailParams,
    SetCodeParams,
    CollectionAddParams,
    CollectionUpdateParams,
    OtherPrintingParams,
} from '../models/search'
import type {
    PaginatedResult,
    MutationResult,
    AddResult,
    InsertResult,
    DeleteResult,
    MergeResult,
    ExportResult,
} from '../models/responses'
// Channel names only ever come from '../models/channels': importing them from the
// main-process modules pulls those modules' node dependencies into this bundle,
// which a preload script cannot require.
import {
    DIALOG_SHOW_SAVE_NAME,
    COLLECTION_LIST_NAME,
    COLLECTION_ADD_NAME,
    COLLECTION_ADD_BATCH_NAME,
    COLLECTION_UPDATE_NAME,
    COLLECTION_DELETE_NAME,
    COLLECTION_DELETE_MANY_NAME,
    CARDS_SEARCH_NAME,
    CARDS_DETAIL_NAME,
    CARDS_OTHERS_NAME,
    STATS_SUMMARY_NAME,
    STATS_COLOR_DISTRIBUTION_NAME,
    STATS_RARITY_BREAKDOWN_NAME,
    STATS_TOP_VALUE_NAME,
    STATS_BY_SET_NAME,
    DUPLICATES_LIST_NAME,
    DUPLICATES_IDS_NAME,
    DUPLICATES_MERGE_NAME,
    DUPLICATES_FULL_MERGE_NAME,
    DUPLICATES_DELETE_NAME,
    MISSING_LIST_NAME,
    MISSING_FETCH_SET_NAME,
    MISSING_FETCH_SET_CARDS_NAME,
    MISSING_FETCH_CARD_NAME,
    COLLECTION_EXPORT_NAME,
    COLLECTION_EXPORT_MOXFIELD_NAME,
    COLLECTION_EXPORT_MANABOX_NAME,
    DB_PATH_NAME,
} from '../models/channels'

contextBridge.exposeInMainWorld('api', {
    // Settings
    settingsGet: (key: keyof AppSettings) => 
        ipcRenderer.invoke('settings:get', key),
    settingsSet: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
        ipcRenderer.invoke('settings:set', key, value),
    logPath: (): Promise<string> => 
        ipcRenderer.invoke('settings:logPath'),
    dbPath: (): Promise<string> =>
        ipcRenderer.invoke(DB_PATH_NAME),

    // Collection
    collectionList: (params: CardSearchParams): Promise<PaginatedResult<CollectionCard>> =>
        ipcRenderer.invoke(COLLECTION_LIST_NAME, params),
    collectionAdd: (params: CollectionAddParams): Promise<AddResult> =>
        ipcRenderer.invoke(COLLECTION_ADD_NAME, params),
    collectionAddBatch: (items: CollectionAddParams[]): Promise<InsertResult> =>
        ipcRenderer.invoke(COLLECTION_ADD_BATCH_NAME, items),
    collectionUpdate: (params: CollectionUpdateParams): Promise<MutationResult> =>
        ipcRenderer.invoke(COLLECTION_UPDATE_NAME, params),
    collectionDelete: (id: number): Promise<MutationResult> =>
        ipcRenderer.invoke(COLLECTION_DELETE_NAME, id),
    collectionDeleteMany: (ids: number[]): Promise<DeleteResult> =>
        ipcRenderer.invoke(COLLECTION_DELETE_MANY_NAME, ids),

    // Cards
    cardSearch: (params: CardSearchParams): Promise<PaginatedResult<ScryfallCard>> =>
        ipcRenderer.invoke(CARDS_SEARCH_NAME, params),
    cardDetail: (params: CardDetailParams): Promise<CardDetail | null> =>
        ipcRenderer.invoke(CARDS_DETAIL_NAME, params),
    cardOtherPrintings: (params: OtherPrintingParams): Promise<PaginatedResult<CollectionCard>> =>
        ipcRenderer.invoke(CARDS_OTHERS_NAME, params),

    // Stats
    statsSummary: (): Promise<StatsSummary> =>
        ipcRenderer.invoke(STATS_SUMMARY_NAME),
    statsColors: (): Promise<StatsColors> =>
        ipcRenderer.invoke(STATS_COLOR_DISTRIBUTION_NAME),
    statsRarity: (): Promise<StatsRarityEntry[]> =>
        ipcRenderer.invoke(STATS_RARITY_BREAKDOWN_NAME),
    statsTopValue: (params?: { limit?: number }): Promise<CollectionCard[]> =>
        ipcRenderer.invoke(STATS_TOP_VALUE_NAME, params),
    statsBySet: (params?: { limit?: number }): Promise<StatsSetEntry[]> =>
        ipcRenderer.invoke(STATS_BY_SET_NAME, params),

    // Duplicates
    duplicatesList: (): Promise<DuplicateCard[]> =>
        ipcRenderer.invoke(DUPLICATES_LIST_NAME),
    duplicatesRows: (ids: number[]): Promise<DuplicateCardInstance[]> =>
        ipcRenderer.invoke(DUPLICATES_IDS_NAME, ids),
    duplicatesMerge: (params: CardDetailParams): Promise<MutationResult> =>
        ipcRenderer.invoke(DUPLICATES_MERGE_NAME, params),
    duplicatesMergeAll: (): Promise<MergeResult> =>
        ipcRenderer.invoke(DUPLICATES_FULL_MERGE_NAME),
    duplicatesRemoveAll: (): Promise<DeleteResult> =>
        ipcRenderer.invoke(DUPLICATES_DELETE_NAME),

    // Missing cards
    missingList: (): Promise<MissingCard[]> =>
        ipcRenderer.invoke(MISSING_LIST_NAME),
    missingFetchSet: (params: SetCodeParams): Promise<MutationResult> =>
        ipcRenderer.invoke(MISSING_FETCH_SET_NAME, params),
    missingFetchCards: (params: SetCodeParams): Promise<InsertResult> =>
        ipcRenderer.invoke(MISSING_FETCH_SET_CARDS_NAME, params),
    missingFetchCard: (params: CardDetailParams): Promise<MutationResult> =>
        ipcRenderer.invoke(MISSING_FETCH_CARD_NAME, params),

    // Import/export
    showSaveDialog: (defaultName: string): Promise<string | null> =>
        ipcRenderer.invoke(DIALOG_SHOW_SAVE_NAME, defaultName),
    exportCollection: (filePath: string): Promise<ExportResult> =>
        ipcRenderer.invoke(COLLECTION_EXPORT_NAME, filePath),
    exportCollectionMoxfield: (filePath: string): Promise<ExportResult> =>
        ipcRenderer.invoke(COLLECTION_EXPORT_MOXFIELD_NAME, filePath),
    exportCollectionManabox: (filePath: string): Promise<ExportResult> =>
        ipcRenderer.invoke(COLLECTION_EXPORT_MANABOX_NAME, filePath),

    // Logging
    logMessage: (entry: LogEntry): void => ipcRenderer.send('log:message', entry),

    // Keyrune set symbols
    refreshSetSymbols: (): Promise<string> =>
        ipcRenderer.invoke('data:refreshSetSymbols'),
    keyruneVersion: (): Promise<KeyruneVersion> =>
        ipcRenderer.invoke('data:keyruneVersion'),

    // Scryfall data refresh
    refreshManaSymbols: (): Promise<void> =>
        ipcRenderer.invoke('data:refreshManaSymbols'),
    refreshSets: (): Promise<{ inserted: number }> =>
        ipcRenderer.invoke('data:refreshSets'),
    refreshCards: (): Promise<{ inserted: number }> =>
        ipcRenderer.invoke('data:refreshCards'),

    // CCMG font
    downloadCCMGFont: (): Promise<void> =>
        ipcRenderer.invoke('data:downloadCCMGFont'),
    ccmgFontStatus: (): Promise<{ downloaded: boolean }> =>
        ipcRenderer.invoke('data:ccmgFontStatus'),

    // App
    getAppIcon: (): Promise<string> =>
        ipcRenderer.invoke('app:icon'),
    appVersion: (): Promise<string> =>
        ipcRenderer.invoke('app:version'),
    restartApp: (): Promise<void> =>
        ipcRenderer.invoke('app:restart'),
})
