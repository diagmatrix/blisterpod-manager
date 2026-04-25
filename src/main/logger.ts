import log from 'electron-log/main.js'
import { app } from 'electron'
import { join } from 'path'
import type { LogEntry } from '../shared/app'

log.initialize()

export const LOG_FILE_PATH = join(app.getPath('userData'), 'logs', 'blisterpod-manager.log')

log.transports.file.resolvePathFn = () => LOG_FILE_PATH
log.transports.file.maxSize = 5 * 1024 * 1024
log.transports.file.level = app.isPackaged ? 'info' : 'debug'
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

log.transports.console.level = app.isPackaged ? false : 'debug'

export function createLogger(context: string) {
  const tag = `[${context.toUpperCase()}]`
  return {
    debug: (message: string, data?: unknown) => log.debug(tag, message, ...(data !== undefined ? [data] : [])),
    info:  (message: string, data?: unknown) => log.info(tag, message,  ...(data !== undefined ? [data] : [])),
    warn:  (message: string, data?: unknown) => log.warn(tag, message,  ...(data !== undefined ? [data] : [])),
    error: (message: string, data?: unknown) => log.error(tag, message, ...(data !== undefined ? [data] : [])),
  }
}

export function handleRendererLog(entry: LogEntry): void {
  const tag = `[${entry.context.toUpperCase()}]`
  const data = entry.data !== undefined ? [entry.data] : []
  log[entry.level](tag, entry.message, ...data)
}
