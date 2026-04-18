import type {
  AppSettings,
  CardSearchParams,
  CardSearchResponse,
  CollectionAddParams,
  CollectionListParams,
  CollectionListResponse,
  CollectionUpdateParams,
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
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
