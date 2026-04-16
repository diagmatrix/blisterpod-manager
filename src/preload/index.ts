import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from '../shared/types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Settings API (BM-07-T4, BM-08)
  settingsGet: (key: keyof AppSettings) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
    ipcRenderer.invoke('settings:set', key, value),

  // TODO: Add more IPC channels here when implementing actual functionality
  // Example: getVersion: () => ipcRenderer.invoke('app:version'),
})
