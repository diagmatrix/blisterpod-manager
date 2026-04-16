import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Settings API (BM-07-T4, BM-08)
  settingsGet: (key: string) => ipcRenderer.invoke('settings:get', key),
  settingsSet: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),

  // TODO: Add more IPC channels here when implementing actual functionality
  // Example: getVersion: () => ipcRenderer.invoke('app:version'),
})
