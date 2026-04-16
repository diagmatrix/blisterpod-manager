import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { initDatabase } from './db'

interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

interface AppSettings {
  windowBounds: WindowBounds
  theme: 'dark' | 'light'
}

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

ipcMain.handle('settings:set', (_, key: keyof AppSettings, value: any) => {
  store.set(key, value)
  if (key === 'theme') {
    nativeTheme.themeSource = value as 'dark' | 'light'
  }
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
    icon: join(__dirname, '../../resources/icon.png'),
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
  }

  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)
  mainWindow.on('close', saveWindowBounds)
}

// App lifecycle
app.whenReady().then(createWindow)

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