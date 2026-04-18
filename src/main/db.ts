import { app, ipcMain } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import Database from 'better-sqlite3'

let db: Database.Database
const DB_NAME = 'collection.db'
const DB_PATH = join(join(process.cwd(), 'db'), DB_NAME)
// Use in prod
// const DB_PATH = join(app.getPath('userData'), DB_NAME)

export function initDatabase(): void {
  console.log(`Initializing database at: ${DB_PATH}`)
  
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  // NBM-03: Read and execute all .sql files from db/tables/ and db/views/
  const sqlDir = join(process.cwd(), 'db')
  const tables = ['cards.sql', 'scryfall_cards.sql', 'scryfall_sets.sql']
  const views = ['duplicates.sql', 'mapped_collection.sql']

  tables.forEach((file) => {
    console.log(`Executing SQL from: ${file}`)
    const sql = readFileSync(join(sqlDir, 'tables', file), 'utf8')
    db.exec(sql)
  })

  views.forEach((file) => {
    console.log(`Executing SQL from: ${file}`)
    const sql = readFileSync(join(sqlDir, 'views', file), 'utf8')
    db.exec(sql)
  })

  console.log('Database schema initialized.')
  setupIpcHandlers()
}

function setupIpcHandlers(): void {
  // BM-01-T1: Collection listing with pagination, sorting, and filtering
  ipcMain.handle('db:collection:list', (_, params: { 
    page: number, 
    pageSize: number, 
    sortColumn?: string, 
    sortOrder?: 'ASC' | 'DESC',
    search?: string,
    searchSet?: string
  }) => {
    const { page, pageSize, sortColumn = 'card_name', sortOrder = 'ASC', search = '', searchSet = '' } = params
    const offset = (page - 1) * pageSize

    let query = `
      SELECT *
      FROM mapped_collection
      WHERE scryfall_id IS NOT NULL
    `
    const conditions: string[] = []
    const values: any[] = []

    if (search) {
      conditions.push('card_name LIKE ?')
      values.push(`%${search}%`)
    }

    if (searchSet) {
      conditions.push('set_code LIKE ?')
      values.push(`%${searchSet}%`)
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`
    }

    // Validation to prevent SQL injection on sortColumn/sortOrder
    const validColumns = ['card_name', 'set_code', 'collector_number', 'quantity_nonfoil', 'quantity_foil', 'total', 'value', 'scryfall_id', 'color_identity', 'rarity']
    const finalSortColumn = validColumns.includes(sortColumn) ? sortColumn : 'card_name'
    const finalSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC'

    query += ` ORDER BY ${finalSortColumn} ${finalSortOrder} LIMIT ? OFFSET ?`
    
    const rows = db.prepare(query).all(...values, pageSize, offset)
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM mapped_collection WHERE scryfall_id IS NOT NULL'
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`
    }
    const { total } = db.prepare(countQuery).get(...values) as { total: number }

    return { rows, total }
  })
}
