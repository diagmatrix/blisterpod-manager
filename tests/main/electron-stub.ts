/**
 * Stand-in for the `electron` module, aliased in for the `main` Vitest project.
 *
 * It exists because `src/main/utils.ts` and `src/main/logger.ts` call into `app`
 * at module load, so importing even a pure module like `db/querybuilder.ts`
 * would otherwise blow up outside an Electron runtime.
 *
 * `app.getAppPath()` returns the repo root, which is what lets `readQueryFile()`
 * resolve the real `db/queries/*.sql` files unchanged.
 *
 * `ipcMain.handle` records into `ipcHandlers` instead of registering, which is
 * how `tests/setup/ipc-harness.ts` reaches the handler bodies.
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export const REPO_ROOT = resolve(import.meta.dirname, '../..')

export type IpcHandler = (event: unknown, ...args: any[]) => unknown

/** Channels registered via `ipcMain.handle`, keyed by channel name. */
export const ipcHandlers = new Map<string, IpcHandler>()
/** Channels registered via `ipcMain.on`, keyed by channel name. */
export const ipcListeners = new Map<string, IpcHandler>()

let userDataDir: string | null = null

/** Created lazily so a test run that never touches `app.getPath` leaves no temp dirs. */
function tempUserData(): string {
    userDataDir ??= mkdtempSync(join(tmpdir(), 'blisterpod-test-'))
    return userDataDir
}

export const app = {
    getVersion: () => '0.0.0-test',
    getName: () => 'blisterpod-manager',
    getAppPath: () => REPO_ROOT,
    getPath: (name: string) => (name === 'userData' ? tempUserData() : join(tempUserData(), name)),
    isPackaged: false,
    whenReady: () => Promise.resolve(),
    on: () => app,
    quit: () => {},
    exit: () => {},
    relaunch: () => {},
}

export const ipcMain = {
    handle: (channel: string, fn: IpcHandler) => { ipcHandlers.set(channel, fn) },
    handleOnce: (channel: string, fn: IpcHandler) => { ipcHandlers.set(channel, fn) },
    removeHandler: (channel: string) => { ipcHandlers.delete(channel) },
    on: (channel: string, fn: IpcHandler) => { ipcListeners.set(channel, fn) },
    off: (channel: string) => { ipcListeners.delete(channel) },
    removeAllListeners: (channel?: string) => {
        if (channel) ipcListeners.delete(channel)
        else ipcListeners.clear()
    },
}

/** Overridable with `vi.spyOn(dialog, 'showSaveDialog')`; cancels by default. */
export const dialog = {
    showSaveDialog: async () => ({ canceled: true, filePath: undefined as string | undefined }),
    showOpenDialog: async () => ({ canceled: true, filePaths: [] as string[] }),
    showMessageBox: async () => ({ response: 0 }),
}

export class BrowserWindow {
    static fromWebContents = () => null
    static getAllWindows = () => [] as BrowserWindow[]
}

export const nativeTheme = { themeSource: 'light' as const, shouldUseDarkColors: false }

export const protocol = {
    registerSchemesAsPrivileged: () => {},
    handle: () => {},
    registerFileProtocol: () => {},
}

export const shell = { openExternal: async () => {}, openPath: async () => '' }

export const contextBridge = { exposeInMainWorld: () => {} }

export const ipcRenderer = {
    invoke: async () => undefined,
    send: () => {},
    on: () => ipcRenderer,
}

/** Clear recorded handlers between tests so registrations never leak across cases. */
export function resetIpcHandlers(): void {
    ipcHandlers.clear()
    ipcListeners.clear()
}

export default { app, ipcMain, dialog, BrowserWindow, nativeTheme, protocol, shell, contextBridge, ipcRenderer }
