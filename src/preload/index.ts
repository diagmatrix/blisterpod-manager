import { contextBridge } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // TODO: Add IPC channels here when implementing actual functionality
  // Example: getVersion: () => ipcRenderer.invoke('app:version'),
})