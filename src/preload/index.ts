import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, LogEntry, KeyruneVersion } from '../shared/app'
import type { CollectionCard, MissingCard, DuplicateCard, DuplicateCardInstance, CardDetail, ScryfallCard } from '../shared/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../shared/stats'
import type {
  CardSearchParams,
  CardDetailParams,
  SetCodeParams,
  CollectionAddParams,
  CollectionUpdateParams,
  OtherPrintingParams,
} from '../shared/search'
import type {
  PaginatedResult,
  MutationResult,
  AddResult,
  InsertResult,
  DeleteResult,
  MergeResult,
  ExportResult,
} from '../shared/responses'

contextBridge.exposeInMainWorld('api', {
  // Settings API (BM-07-T4, BM-08)
  settingsGet: (key: keyof AppSettings) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Collection read (BM-01)
  collectionList: (params: CardSearchParams): Promise<PaginatedResult<CollectionCard>> =>
    ipcRenderer.invoke('collection:list', params),

  // Card search (BM-02)
  cardSearch: (params: CardSearchParams): Promise<PaginatedResult<ScryfallCard>> =>
    ipcRenderer.invoke('cards:search', params),

  // Card detail (BM-03)
  cardDetail: (params: CardDetailParams): Promise<CardDetail | null> =>
    ipcRenderer.invoke('cards:detail', params),
  cardOtherPrintings: (params: OtherPrintingParams): Promise<PaginatedResult<CollectionCard>> =>
    ipcRenderer.invoke('cards:other-printings', params),

  // Collection mutations (BM-02)
  collectionAdd: (params: CollectionAddParams): Promise<AddResult> =>
    ipcRenderer.invoke('collection:add', params),
  collectionAddBatch: (items: CollectionAddParams[]): Promise<InsertResult> =>
    ipcRenderer.invoke('collection:add-batch', items),
  collectionUpdate: (params: CollectionUpdateParams): Promise<MutationResult> =>
    ipcRenderer.invoke('collection:update', params),
  collectionDelete: (id: number): Promise<MutationResult> =>
    ipcRenderer.invoke('collection:delete', id),
  collectionDeleteMany: (ids: number[]): Promise<DeleteResult> =>
    ipcRenderer.invoke('collection:delete-many', ids),

  // Stats (BM-04)
  statsSummary: (): Promise<StatsSummary> =>
    ipcRenderer.invoke('stats:summary'),
  statsColors: (): Promise<StatsColors> =>
    ipcRenderer.invoke('stats:colors'),
  statsRarity: (): Promise<StatsRarityEntry[]> =>
    ipcRenderer.invoke('stats:rarity'),
  statsTopValue: (params?: { limit?: number }): Promise<CollectionCard[]> =>
    ipcRenderer.invoke('stats:top-value', params),
  statsBySet: (params?: { limit?: number }): Promise<StatsSetEntry[]> =>
    ipcRenderer.invoke('stats:by-set', params),

  // Collection errors (BM-05)
  duplicatesList: (): Promise<DuplicateCard[]> =>
    ipcRenderer.invoke('duplicates:list'),
  duplicatesRows: (ids: number[]): Promise<DuplicateCardInstance[]> =>
    ipcRenderer.invoke('duplicates:ids', ids),
  duplicatesMerge: (params: CardDetailParams): Promise<MutationResult> =>
    ipcRenderer.invoke('duplicates:merge', params),
  duplicatesMergeAll: (): Promise<MergeResult> =>
    ipcRenderer.invoke('duplicates:merge-all'),
  duplicatesRemoveAll: (): Promise<DeleteResult> =>
    ipcRenderer.invoke('duplicates:remove-all'),
  missingList: (): Promise<MissingCard[]> =>
    ipcRenderer.invoke('missing:list'),
  missingFetchSet: (params: SetCodeParams): Promise<MutationResult> =>
    ipcRenderer.invoke('missing:fetch-set', params),
  missingFetchCards: (params: SetCodeParams): Promise<InsertResult> =>
    ipcRenderer.invoke('missing:fetch-cards', params),
  missingFetchCard: (params: CardDetailParams): Promise<MutationResult> =>
    ipcRenderer.invoke('missing:fetch-card', params),

  // Logging bridge (renderer → main file logger)
  logMessage: (entry: LogEntry): void =>
    ipcRenderer.send('log:message', entry),
  logPath: (): Promise<string> =>
    ipcRenderer.invoke('settings:logPath'),

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

  // App icon (base64 data URL, theme-aware)
  getAppIcon: (): Promise<string> =>
    ipcRenderer.invoke('app:icon'),

  appVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:version'),

  restartApp: (): Promise<void> =>
    ipcRenderer.invoke('app:restart'),

  // Import/export
  showSaveDialog: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:showSaveDialog', defaultName),
  exportCollection: (filePath: string): Promise<ExportResult> =>
    ipcRenderer.invoke('collection:export', filePath),
  exportCollectionMoxfield: (filePath: string): Promise<ExportResult> =>
    ipcRenderer.invoke('collection:export-moxfield', filePath),
})
