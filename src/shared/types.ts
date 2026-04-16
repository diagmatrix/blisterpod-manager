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
}

export type Theme = 'dark' | 'light'
