import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, CollectionListParams, CollectionListResponse } from '../shared/types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Settings API (BM-07-T4, BM-08)
  settingsGet: (key: keyof AppSettings) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Database API (BM-01)
  collectionList: (params: CollectionListParams): Promise<CollectionListResponse> =>
    ipcRenderer.invoke('db:collection:list', params),
})
