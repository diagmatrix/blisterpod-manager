/**
 * Stand-in for `electron-log/main.js`, aliased in for the `main` Vitest project.
 *
 * `src/main/logger.ts` calls `log.initialize()` and mutates `log.transports.*`
 * at module load, so the shape matters more than the behaviour.
 *
 * Records instead of printing. The DB handlers swallow errors into `logger.error`
 * (see the `catch` blocks in `src/main/db/*.ts`), so `logRecords` is often the
 * only place a failure is visible.
 */
export interface LogRecord {
    level: 'debug' | 'info' | 'warn' | 'error' | 'verbose' | 'silly'
    args: unknown[]
}

export const logRecords: LogRecord[] = []

function record(level: LogRecord['level']) {
    return (...args: unknown[]) => { logRecords.push({ level, args }) }
}

/** Every record whose level is `error`, for asserting a handler failed quietly. */
export function loggedErrors(): LogRecord[] {
    return logRecords.filter((r) => r.level === 'error')
}

export function resetLogRecords(): void {
    logRecords.length = 0
}

const log = {
    initialize: () => {},
    transports: {
        file: {
            resolvePathFn: undefined as unknown,
            maxSize: 0,
            level: 'debug' as unknown,
            format: '',
        },
        console: { level: 'debug' as unknown, format: '' },
    },
    debug: record('debug'),
    info: record('info'),
    warn: record('warn'),
    error: record('error'),
    verbose: record('verbose'),
    silly: record('silly'),
}

export default log
