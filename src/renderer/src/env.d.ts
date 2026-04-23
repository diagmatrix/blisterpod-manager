import type {
  AppSettings,
  CardSearchParams,
  CardSearchResponse,
  CollectionAddParams,
  CollectionCard,
  CollectionListParams,
  CollectionListResponse,
  CollectionUpdateParams,
  LogEntry,
  StatsSummary,
  StatsColors,
  StatsRarityEntry,
  StatsSetEntry,
  KeyruneVersion,
} from '../../shared/types'

export interface ElectronAPI {
  settingsGet: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>
  settingsSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  collectionList: (params: CollectionListParams) => Promise<CollectionListResponse>
  cardSearch: (params: CardSearchParams) => Promise<CardSearchResponse>
  collectionAdd: (params: CollectionAddParams) => Promise<{ id: number } | { error: string }>
  collectionAddBatch: (items: CollectionAddParams[]) => Promise<{ inserted: number; errors: { index: number; message: string }[] }>
  collectionUpdate: (params: CollectionUpdateParams) => Promise<{ success: true } | { error: string }>
  collectionDelete: (params: { id: number }) => Promise<{ success: true } | { error: string }>
  statsSummary: () => Promise<StatsSummary>
  statsColors: () => Promise<StatsColors>
  statsRarity: () => Promise<StatsRarityEntry[]>
  statsTopValue: (params?: { limit?: number }) => Promise<CollectionCard[]>
  statsBySet: (params?: { limit?: number }) => Promise<StatsSetEntry[]>
  logMessage: (entry: LogEntry) => void
  logPath: () => Promise<string>
  refreshSetSymbols: () => Promise<string>
  keyruneVersion: () => Promise<KeyruneVersion>
  refreshSets: () => Promise<{ inserted: number }>
  refreshCards: () => Promise<{ inserted: number }>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
