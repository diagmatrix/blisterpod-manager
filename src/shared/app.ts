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
    defaultPageSize?: number
}

export const PAGE_SIZES = [30, 60, 120] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const FALLBACK_PAGE_SIZE: PageSize = PAGE_SIZES[0]

export function isPageSize(value: unknown): value is PageSize {
    return typeof value === 'number' && (PAGE_SIZES as readonly number[]).includes(value)
}

export type Theme = 'dark' | 'light'

export type KeyruneVersion = { downloaded: string | null }

export interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error'
    context: string
    message: string
    data?: unknown
}
