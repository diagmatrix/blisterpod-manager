import type { AppSettings, LogEntry, KeyruneVersion } from '../../models/app'
import type { CollectionCard, MissingCard, DuplicateCard, DuplicateCardInstance, CardDetail, ScryfallCard } from '../../models/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../../models/stats'
import type {
  CardSearchParams,
  CardDetailParams,
  SetCodeParams,
  CollectionAddParams,
  CollectionUpdateParams,
  OtherPrintingParams,
} from '../../models/search'
import type {
  PaginatedResult,
  MutationResult,
  AddResult,
  InsertResult,
  DeleteResult,
  MergeResult,
  ExportResult,
} from '../../models/responses'

export interface ElectronAPI {
  settingsGet: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>
  settingsSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  collectionList: (params: CardSearchParams) => Promise<PaginatedResult<CollectionCard>>
  cardSearch: (params: CardSearchParams) => Promise<PaginatedResult<ScryfallCard>>
  cardDetail: (params: CardDetailParams) => Promise<CardDetail | null>
  cardOtherPrintings: (params: OtherPrintingParams) => Promise<PaginatedResult<CollectionCard>>
  collectionAdd: (params: CollectionAddParams) => Promise<AddResult>
  collectionAddBatch: (items: CollectionAddParams[]) => Promise<InsertResult>
  collectionUpdate: (params: CollectionUpdateParams) => Promise<MutationResult>
  collectionDelete: (id: number) => Promise<MutationResult>
  collectionDeleteMany: (ids: number[]) => Promise<DeleteResult>
  statsSummary: () => Promise<StatsSummary>
  statsColors: () => Promise<StatsColors>
  statsRarity: () => Promise<StatsRarityEntry[]>
  statsTopValue: (params?: { limit?: number }) => Promise<CollectionCard[]>
  statsBySet: (params?: { limit?: number }) => Promise<StatsSetEntry[]>
  duplicatesList: () => Promise<DuplicateCard[]>
  duplicatesRows: (ids: number[]) => Promise<DuplicateCardInstance[]>
  duplicatesMerge: (params: CardDetailParams) => Promise<MutationResult>
  duplicatesMergeAll: () => Promise<MergeResult>
  duplicatesRemoveAll: () => Promise<DeleteResult>
  missingList: () => Promise<MissingCard[]>
  missingFetchSet: (params: SetCodeParams) => Promise<MutationResult>
  missingFetchCards: (params: SetCodeParams) => Promise<InsertResult>
  missingFetchCard: (params: CardDetailParams) => Promise<MutationResult>
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
  exportCollection: (filePath: string) => Promise<ExportResult>
  exportCollectionMoxfield: (filePath: string) => Promise<ExportResult>
  exportCollectionManabox: (filePath: string) => Promise<ExportResult>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
