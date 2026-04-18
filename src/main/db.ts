import { app, ipcMain } from 'electron'
import { isAbsolute, join } from 'path'
import { readFileSync } from 'fs'
import Database from 'better-sqlite3'

let db: Database.Database
const DB_NAME = 'collection.db'

function resolveDbPath(): string {
  const fromEnv = process.env.BLISTERPOD_DB_PATH ?? process.env.DB_PATH
  const fromArg = readArgValue('--db-path')
  const candidate = fromEnv ?? fromArg
  
  if (!candidate || candidate.trim().length === 0) {
    return join(app.getPath('userData'), DB_NAME)
  }
  
  return isAbsolute(candidate) ? candidate : join(process.cwd(), candidate)
}

function readArgValue(flag: string): string | undefined {
  const exactPrefix = `${flag}=`
  const directMatch = process.argv.find((arg) => arg.startsWith(exactPrefix))
  if (directMatch) {
    return directMatch.slice(exactPrefix.length)
  }
  
  const index = process.argv.indexOf(flag)
  if (index >= 0 && index + 1 < process.argv.length) {
    return process.argv[index + 1]
  }
  
  return undefined
}

const DB_PATH = resolveDbPath()
export function initDatabase(): void {
  console.log(`Initializing database at: ${DB_PATH}`)
  
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  // NBM-03: Read and execute all .sql files from db/tables/ and db/views/
  const sqlDir = join(process.cwd(), 'db')
  const tables = ['cards.sql', 'scryfall_cards.sql', 'scryfall_sets.sql']
  const views = ['duplicates.sql', 'mapped_collection.sql', 'available_cards.sql']

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

const VALID_RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']
const VALID_COLORS = ['W', 'U', 'B', 'R', 'G', 'C']

function buildRarityConditions(rarities: string[] | undefined): { conditions: string[]; values: any[] } {
  const safe = (rarities ?? []).filter((r) => VALID_RARITIES.includes(r))
  if (safe.length === 0) return { conditions: [], values: [] }
  return {
    conditions: [`rarity IN (${safe.map(() => '?').join(', ')})`],
    values: safe,
  }
}

function buildColorConditions(colors: string[] | undefined, colorMode: string): { conditions: string[]; values: any[] } {
  const safe = (colors ?? []).filter((c) => VALID_COLORS.includes(c))
  if (safe.length === 0) return { conditions: [], values: [] }

  const conditions: string[] = []
  const values: any[] = []

  switch (colorMode) {
    case 'atLeast':
    case 'including':
      safe.filter((c) => c !== 'C').forEach((c) => {
        conditions.push('instr(color_identity, ?) > 0')
        values.push(c)
      })
      break
    case 'exactly': {
      const nonColorless = safe.filter((c) => c !== 'C')
      conditions.push('json_array_length(color_identity) = ?')
      values.push(nonColorless.length)
      nonColorless.forEach((c) => {
        conditions.push('instr(color_identity, ?) > 0')
        values.push(c)
      })
      break
    }
    case 'atMost':
      if (safe.includes('C') && safe.length === 1) {
        conditions.push('json_array_length(color_identity) = 0')
      } else {
        VALID_COLORS.filter((c) => !safe.includes(c)).forEach((c) => {
          conditions.push('instr(color_identity, ?) = 0')
          values.push(c)
        })
      }
      break
  }

  return { conditions, values }
}


function setupIpcHandlers(): void {
  // BM-01-T1: Collection listing with pagination, sorting, and filtering
  ipcMain.handle('db:collection:list', (_, params: { 
    page: number, 
    pageSize: number, 
    sortColumn?: string, 
    sortOrder?: 'ASC' | 'DESC',
    search?: string,
    searchSet?: string,
    tokenFilter?: 'all' | 'cards' | 'tokens',
    rarities?: string[],
    colors?: string[],
    colorMode?: 'atMost' | 'atLeast' | 'exactly',
  }) => {
    const {
      page,
      pageSize,
      sortColumn = 'card_name',
      sortOrder = 'ASC',
      search = '',
      searchSet = '',
      tokenFilter,
      rarities,
      colors,
      colorMode = 'atLeast',
    } = params
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

    // Token filter
    if (tokenFilter === 'cards') {
      conditions.push('is_token = 0')
    } else if (tokenFilter === 'tokens') {
      conditions.push('is_token = 1')
    }

    const { conditions: rarityConds, values: rarityVals } = buildRarityConditions(rarities)
    const { conditions: colorConds, values: colorVals } = buildColorConditions(colors, colorMode ?? 'atLeast')
    conditions.push(...rarityConds, ...colorConds)
    values.push(...rarityVals, ...colorVals)

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

  // BM-02-T1: Search available_cards by name, set, rarity, color with pagination
  ipcMain.handle('db:cards:search', (_, params: import('../shared/types').CardSearchParams) => {
    const { query, set_code, rarities, colors, colorMode = 'including', page = 1, pageSize = 60 } = params
    const safePageSize = Math.min(pageSize, 120)
    const offset = (page - 1) * safePageSize

    const conditions: string[] = []
    const values: any[] = []

    if (query && query.length >= 2) {
      conditions.push('name LIKE ?')
      values.push(`%${query}%`)
    }

    if (set_code) {
      conditions.push('set_code = ?')
      values.push(set_code.toUpperCase())
    }

    const { conditions: rarityConds, values: rarityVals } = buildRarityConditions(rarities)
    const { conditions: colorConds, values: colorVals } = buildColorConditions(colors, colorMode)
    conditions.push(...rarityConds, ...colorConds)
    values.push(...rarityVals, ...colorVals)

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sql = `SELECT * FROM available_cards ${where} ORDER BY collector_number_normalised ASC, name ASC LIMIT ? OFFSET ?`
    global.console.log('Executing query:', sql)

    const rows = db.prepare(sql).all(...values, safePageSize, offset)
    const { total } = db.prepare(`SELECT COUNT(*) as total FROM available_cards ${where}`).get(...values) as { total: number }

    return { rows, total }
  })

  // BM-02-T3: Add a single card to the collection
  ipcMain.handle('db:collection:add', (_, params: {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
  }) => {
    const { set_code, collector_number, quantity_nonfoil, quantity_foil } = params
    if (quantity_nonfoil < 0 || quantity_foil < 0) return { error: 'Quantities must be non-negative' }
    if (quantity_nonfoil + quantity_foil === 0) return { error: 'At least one copy must be owned' }

    const exists = db.prepare('SELECT 1 FROM available_cards WHERE set_code = ? AND collector_number = ?').get(set_code, collector_number)
    if (!exists) return { error: `Card not found: ${set_code} #${collector_number}` }

    const insert = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(set_code, collector_number, quantity_nonfoil, quantity_foil)
      return { id: result.lastInsertRowid }
    })
    return insert()
  })

  // BM-02-T2b: Batch insert cards into the collection
  ipcMain.handle('db:collection:add-batch', (_, items: {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
  }[]) => {
    const insertStmt = db.prepare(`
      INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    const checkStmt = db.prepare('SELECT 1 FROM available_cards WHERE set_code = ? AND collector_number = ?')

    let inserted = 0
    const errors: { index: number; message: string }[] = []

    const batchInsert = db.transaction(() => {
      items.forEach((item, index) => {
        const { set_code, collector_number, quantity_nonfoil, quantity_foil } = item
        if (quantity_nonfoil < 0 || quantity_foil < 0) {
          errors.push({ index, message: 'Quantities must be non-negative' })
          return
        }
        if (quantity_nonfoil + quantity_foil === 0) {
          errors.push({ index, message: 'At least one copy must be owned' })
          return
        }
        if (!checkStmt.get(set_code, collector_number)) {
          errors.push({ index, message: `Card not found: ${set_code} #${collector_number}` })
          return
        }
        insertStmt.run(set_code, collector_number, quantity_nonfoil, quantity_foil)
        inserted++
      })
    })
    batchInsert()
    return { inserted, errors }
  })

  // BM-02-T4: Update quantities for an existing collection card
  ipcMain.handle('db:collection:update', (_, params: {
    id: number
    quantity_nonfoil: number
    quantity_foil: number
  }) => {
    const { id, quantity_nonfoil, quantity_foil } = params
    if (quantity_nonfoil < 0 || quantity_foil < 0) return { error: 'Quantities must be non-negative' }
    if (quantity_nonfoil + quantity_foil === 0) return { error: 'At least one copy must be owned' }

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE cards SET quantity_nonfoil = ?, quantity_foil = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quantity_nonfoil, quantity_foil, id)
      return { success: true }
    })
    return update()
  })

  // BM-02-T5: Delete a card from the collection
  ipcMain.handle('db:collection:delete', (_, params: { id: number }) => {
    const del = db.transaction(() => {
      db.prepare('DELETE FROM cards WHERE id = ?').run(params.id)
      return { success: true }
    })
    return del()
  })
}
