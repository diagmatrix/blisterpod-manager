import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  CardSearchParams,
  CardSearchResponse,
  CollectionAddParams,
  CollectionListParams,
  CollectionListResponse,
  CollectionUpdateParams,
  StatsSummary,
  CollectionCard,
  StatsColors,
  StatsRarityEntry,
  StatsSetEntry,
} from '../shared/types'

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
})
