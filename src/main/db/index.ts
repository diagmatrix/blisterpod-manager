import { createLogger } from "../logger";
import { join } from 'path'
import Database from 'better-sqlite3'
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { walkDir } from "../utils";
import { readFileSync } from "fs";
import { registerExportHandlers } from "./export";
import { registerStatsHandlers } from "./stats";
import { registerCardsHandlers } from "./cards";
import { registerMissingCardsHandlers } from "./missing";
import { registerDuplicateCardsHandlers } from "./duplicates";
import { registerCollectionHandlers } from "./collection";

// For testing, the database name is overwritten
const DB_NAME = 'test_collection.db'
//const DB_NAME = 'collection.db'
const DB_PATH = join(app.getPath('userData'), DB_NAME)
const SQL_DIR = join(app.getAppPath(), 'db')
const TABLES_DIR = join(SQL_DIR, 'tables')
const VIEWS_DIR = join(SQL_DIR, 'views')
const QUERIES_DIR = join(SQL_DIR, 'queries')

const logger = createLogger('db')

let db: Database.Database

async function executeSQLFilesFromDir(db: Database.Database, dirPath: string): Promise<void> {
    for await (const filePath of walkDir(dirPath)) {
        if (filePath.endsWith('.sql')) {
            logger.debug(`Executing SQL file: ${filePath}`)
            const sql = readFileSync(filePath, 'utf-8')
            db.exec(sql)
        }
    }
}

export function readQueryFile(queryName: string): string {
    const queryFilePath = join(QUERIES_DIR, `${queryName}`)
    try {
        return readFileSync(queryFilePath, 'utf-8')
    } catch (err) {
        logger.error(`Query file not found: ${queryFilePath}`)
        throw err
    }
}

export async function initDatabase(): Promise<void> {
    logger.info(`Initializing database at ${DB_PATH}`)

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')

    await executeSQLFilesFromDir(db, TABLES_DIR)
    await executeSQLFilesFromDir(db, VIEWS_DIR)

    setUpIPCHandlers()
}

export function getDb(): Database.Database {
  return db
}

function setUpIPCHandlers(): void {
    // Show native save dialog and return chosen path (or null if cancelled)
    // TODO: Maybe this should be moved to a separate file as it does not have anything to do with databases
    ipcMain.handle('dialog:showSaveDialog', async (event, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)!
    const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
    })
    return result.canceled ? null : result.filePath
    })

    // Collection handlers
    registerCollectionHandlers(db)

    // Stats handlers
    registerStatsHandlers(db)

    // Export handlers
    registerExportHandlers(db)

    // Cards handlers
    registerCardsHandlers(db)

    // Missing cards handlers
    registerMissingCardsHandlers(db)

    // Duplicate cards handlers
    registerDuplicateCardsHandlers(db)
}