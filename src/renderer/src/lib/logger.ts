import type { LogEntry } from '../../../../shared/types'

export function createLogger(context: string) {
  const send = (level: LogEntry['level'], message: string, data?: unknown) => {
    const entry: LogEntry = { level, context, message, ...(data !== undefined && { data }) }
    if (window.api?.logMessage) {
      window.api.logMessage(entry)
    } else {
      console[level](`[${context.toUpperCase()}]`, message, ...(data !== undefined ? [data] : []))
    }
  }

  return {
    debug: (message: string, data?: unknown) => send('debug', message, data),
    info:  (message: string, data?: unknown) => send('info',  message, data),
    warn:  (message: string, data?: unknown) => send('warn',  message, data),
    error: (message: string, data?: unknown) => send('error', message, data),
  }
}
