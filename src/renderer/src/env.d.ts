import type { AppSettings, CollectionListParams, CollectionListResponse } from '../../shared/types'

export interface ElectronAPI {
  settingsGet: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>
  settingsSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  collectionList: (params: CollectionListParams) => Promise<CollectionListResponse>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
