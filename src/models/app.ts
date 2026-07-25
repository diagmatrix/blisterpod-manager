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

export const PAGE_SIZE_FAMILIES = [
    [25, 50, 100],
    [30, 60, 120],
] as const
export type PageSize = (typeof PAGE_SIZE_FAMILIES)[number][number]
export const PAGE_SIZES: readonly PageSize[] = PAGE_SIZE_FAMILIES.flat().sort((a, b) => a - b)
export const FALLBACK_PAGE_SIZE_FAMILY = PAGE_SIZE_FAMILIES[1]
export const FALLBACK_PAGE_SIZE: PageSize = FALLBACK_PAGE_SIZE_FAMILY[0]

export function isPageSize(value: unknown): value is PageSize {
    return typeof value === 'number' && (PAGE_SIZES as readonly number[]).includes(value)
}

export function pageSizeFamily(size: number): readonly PageSize[] {
    return PAGE_SIZE_FAMILIES.find((family) => (family as readonly number[]).includes(size))
        ?? FALLBACK_PAGE_SIZE_FAMILY
}

export type Theme = 'dark' | 'light'

export type KeyruneVersion = { downloaded: string | null }

export interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error'
    context: string
    message: string
    data?: unknown
}
