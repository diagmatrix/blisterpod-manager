import type { AppSettings } from '../../shared/types'

export interface ElectronAPI {
  settingsGet: <K extends keyof AppSettings>(key: K) => Promise<AppSettings[K]>
  settingsSet: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
