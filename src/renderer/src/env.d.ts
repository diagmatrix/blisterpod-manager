import type { AppSettings, LogEntry, KeyruneVersion } from '../../shared/app'
import type { CollectionCard, MissingCard, DuplicateCard, CardDetail } from '../../shared/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../../shared/stats'
import type {
  CardSearchParams,
  CardSearchResponse,
  CardDetailParams,
  OtherPrintingsResponse,
  CollectionAddParams,
  CollectionListParams,
  CollectionListResponse,
  CollectionUpdateParams,
  OtherPrintingParams,
} from '../../shared/search'

export interface ElectronAPI {
  settingsGet: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>
  settingsSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  collectionList: (params: CollectionListParams) => Promise<CollectionListResponse>
  cardSearch: (params: CardSearchParams) => Promise<CardSearchResponse>
  cardDetail: (params: CardDetailParams) => Promise<CardDetail | { error: string }>
  cardOtherPrintings: (params: OtherPrintingParams) => Promise<OtherPrintingsResponse>
  collectionAdd: (params: CollectionAddParams) => Promise<{ id: number } | { error: string }>
  collectionAddBatch: (items: CollectionAddParams[]) => Promise<{ inserted: number; errors: { index: number; message: string }[] }>
  collectionUpdate: (params: CollectionUpdateParams) => Promise<{ success: true } | { error: string }>
  collectionDelete: (params: { id: number }) => Promise<{ success: true } | { error: string }>
  collectionDeleteMany: (ids: number[]) => Promise<{ deleted: number }>
  statsSummary: () => Promise<StatsSummary>
  statsColors: () => Promise<StatsColors>
  statsRarity: () => Promise<StatsRarityEntry[]>
  statsTopValue: (params?: { limit?: number }) => Promise<CollectionCard[]>
  statsBySet: (params?: { limit?: number }) => Promise<StatsSetEntry[]>
  duplicatesList: () => Promise<DuplicateCard[]>
  duplicatesRows: (ids: number[]) => Promise<{ id: number; quantity_nonfoil: number; quantity_foil: number; created_at: string | null; updated_at: string | null }[]>
  duplicatesMerge: (params: { set_code: string; collector_number: string }) => Promise<{ success: true } | { error: string }>
  duplicatesMergeAll: () => Promise<{ merged: number } | { error: string }>
  duplicatesRemoveAll: () => Promise<{ removed: number } | { error: string }>
  missingList: () => Promise<MissingCard[]>
  missingFetchSet: (params: { set_code: string }) => Promise<{ success: true } | { error: string }>
  missingFetchCards: (params: { set_code: string }) => Promise<{ inserted: number } | { error: string }>
  missingFetchCard: (params: { set_code: string; collector_number: string }) => Promise<{ success: true } | { error: string }>
  logMessage: (entry: LogEntry) => void
  logPath: () => Promise<string>
  refreshSetSymbols: () => Promise<string>
  keyruneVersion: () => Promise<KeyruneVersion>
  refreshManaSymbols: () => Promise<void>
  refreshSets: () => Promise<{ inserted: number }>
  refreshCards: () => Promise<{ inserted: number }>
  downloadCCMGFont: () => Promise<void>
  ccmgFontStatus: () => Promise<{ downloaded: boolean }>
  getAppIcon: () => Promise<string>
  appVersion: () => Promise<string>
  restartApp: () => Promise<void>
  showSaveDialog: (defaultName: string) => Promise<string | null>
  exportCollection: (filePath: string) => Promise<{ exported: number }>
  exportCollectionMoxfield: (filePath: string) => Promise<{ exported: number }>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
