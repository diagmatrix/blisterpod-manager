import { createLogger, handleRendererLog, LOG_FILE_PATH } from './logger'
import { app, BrowserWindow, nativeTheme, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import Store from 'electron-store'
import { initDatabase, getDb } from './db'
import { initCardImageProtocol } from './cardImages'
import { initKeyruneProtocol, downloadKeyruneAssets, getKeyruneVersion } from './keyruneAssets'
import { initFontProtocol, downloadCCMGFont, getCCMGFontStatus } from './ccmgFont'
import { initManaSymbolProtocol, downloadManaSymbols } from './manaSymbols'
import { refreshSets, refreshCards } from './scryfallRefresh'
import { getIconPath } from './utils'
import type { WindowBounds, AppSettings, LogEntry } from '../shared/app'

const log = createLogger('app')

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'card-image',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
  {
    scheme: 'keyrune',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
  {
    scheme: 'app-font',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
  {
    scheme: 'mana-symbol',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
])

const DEFAULT_WINDOW_BOUNDS: WindowBounds = {
  width: 1280,
  height: 800,
  isMaximized: false
}

// Settings persistence using electron-store
const store = new Store<AppSettings>({
  defaults: {
    windowBounds: DEFAULT_WINDOW_BOUNDS,
    theme: 'light'
  }
})

// Set initial theme (dark title bar on Windows)
nativeTheme.themeSource = store.get('theme')

// IPC handlers for settings (BM-07-T4, BM-08)
ipcMain.handle('settings:get', (_, key: keyof AppSettings) => {
  return store.get(key)
})

ipcMain.handle('settings:set', (_, key: keyof AppSettings, value: unknown) => {
  store.set(key, value as AppSettings[typeof key])
  if (key === 'theme') {
    const theme = value as AppSettings['theme']
    nativeTheme.themeSource = theme
    mainWindow?.setIcon(getIconPath(theme))
  }
})

ipcMain.handle('settings:logPath', () => LOG_FILE_PATH)

// IPC handler for renderer-side logging
ipcMain.on('log:message', (_, entry: LogEntry) => {
  handleRendererLog(entry)
})

// Initialize database before creating window (NBM-03, NBM-06)
initDatabase()

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  // Get saved window bounds, fall back to defaults if missing
  const windowBounds: WindowBounds = store.get('windowBounds', DEFAULT_WINDOW_BOUNDS)

  mainWindow = new BrowserWindow({
    x: windowBounds.x,
    y: windowBounds.y,
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 1024,
    minHeight: 768,
    title: 'Blisterpod Manager',
    show: false, // Don't show until ready-to-show
    icon: getIconPath(store.get('theme')),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Restore maximized state
  if (windowBounds.isMaximized) {
    mainWindow.maximize()
  }

  // Show window when content is ready (register before loadURL to avoid race)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  // electron-vite injects ELECTRON_RENDERER_URL in dev mode
  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Save window state on resize/move/close
  const saveWindowBounds = () => {
    if (!mainWindow) return

    const bounds = mainWindow.getBounds()
    const isMaximized = mainWindow.isMaximized()

    store.set('windowBounds', {
      ...bounds,
      isMaximized
    })

    log.debug('Window bounds saved', { bounds, isMaximized })
  }

  mainWindow.on('close', saveWindowBounds)
  mainWindow.on('blur', saveWindowBounds)

  log.info('Main window created')
}

// App lifecycle
ipcMain.handle('data:refreshSetSymbols', () => downloadKeyruneAssets())
ipcMain.handle('data:refreshManaSymbols', () => downloadManaSymbols())
ipcMain.handle('data:keyruneVersion', () => ({ downloaded: getKeyruneVersion() }))
ipcMain.handle('data:refreshSets', () => refreshSets(getDb()))
ipcMain.handle('data:refreshCards', () => refreshCards(getDb()))
ipcMain.handle('data:downloadCCMGFont', () => downloadCCMGFont())
ipcMain.handle('data:ccmgFontStatus', () => getCCMGFontStatus())
ipcMain.handle('app:icon', () => {
  const data = readFileSync(getIconPath(store.get('theme')))
  return `data:image/png;base64,${data.toString('base64')}`
})

ipcMain.handle('app:version', () => app.getVersion())

ipcMain.handle('app:restart', () => {
  app.relaunch()
  app.exit(0)
})

app.whenReady().then(() => {
  log.info('App ready')
  initCardImageProtocol()
  initKeyruneProtocol()
  initFontProtocol()
  initManaSymbolProtocol()
  return createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
