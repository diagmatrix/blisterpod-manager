export interface ElectronAPI {
  settingsGet: (key: string) => Promise<any>
  settingsSet: (key: string, value: any) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
