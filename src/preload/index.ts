import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, LogEntry, KeyruneVersion } from '../shared/app'
import type { CollectionCard, MissingCard, DuplicateCard } from '../shared/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../shared/stats'
import type {
  CardSearchParams,
  CardSearchResponse,
  CollectionAddParams,
  CollectionListParams,
  CollectionListResponse,
  CollectionUpdateParams,
} from '../shared/search'

contextBridge.exposeInMainWorld('api', {
  // Settings API (BM-07-T4, BM-08)
  settingsGet: (key: keyof AppSettings) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Collection read (BM-01)
  collectionList: (params: CollectionListParams): Promise<CollectionListResponse> =>
    ipcRenderer.invoke('db:collection:list', params),

  // Card search (BM-02)
  cardSearch: (params: CardSearchParams): Promise<CardSearchResponse> =>
    ipcRenderer.invoke('db:cards:search', params),

  // Collection mutations (BM-02)
  collectionAdd: (params: CollectionAddParams): Promise<{ id: number } | { error: string }> =>
    ipcRenderer.invoke('db:collection:add', params),
  collectionAddBatch: (items: CollectionAddParams[]): Promise<{ inserted: number; errors: { index: number; message: string }[] }> =>
    ipcRenderer.invoke('db:collection:add-batch', items),
  collectionUpdate: (params: CollectionUpdateParams): Promise<{ success: true } | { error: string }> =>
    ipcRenderer.invoke('db:collection:update', params),
  collectionDelete: (params: { id: number }): Promise<{ success: true } | { error: string }> =>
    ipcRenderer.invoke('db:collection:delete', params),

  // Stats (BM-04)
  statsSummary: (): Promise<StatsSummary> =>
    ipcRenderer.invoke('db:stats:summary'),
  statsColors: (): Promise<StatsColors> =>
    ipcRenderer.invoke('db:stats:colors'),
  statsRarity: (): Promise<StatsRarityEntry[]> =>
    ipcRenderer.invoke('db:stats:rarity'),
  statsTopValue: (params?: { limit?: number }): Promise<CollectionCard[]> =>
    ipcRenderer.invoke('db:stats:top-value', params),
  statsBySet: (params?: { limit?: number }): Promise<StatsSetEntry[]> =>
    ipcRenderer.invoke('db:stats:by-set', params),

  // Collection errors (BM-05)
  duplicatesList: (): Promise<DuplicateCard[]> =>
    ipcRenderer.invoke('db:duplicates:list'),
  duplicatesMerge: (params: { set_code: string; collector_number: string }): Promise<{ success: true } | { error: string }> =>
    ipcRenderer.invoke('db:duplicates:merge', params),
  missingList: (): Promise<MissingCard[]> =>
    ipcRenderer.invoke('db:missing:list'),

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
})
