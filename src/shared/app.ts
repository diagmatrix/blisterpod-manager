export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

export interface AppSettings {
  windowBounds: WindowBounds
  theme: 'dark' | 'light'
  font?: 'default' | 'ccmg'
  setsLastRefreshed?: string
  cardsLastRefreshed?: string
  manaSymbolsLastRefreshed?: string
  firstRun?: boolean
}

export type Theme = 'dark' | 'light'

export type KeyruneVersion = { downloaded: string | null }

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  context: string
  message: string
  data?: unknown
}
