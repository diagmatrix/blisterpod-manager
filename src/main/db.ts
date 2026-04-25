import { ipcMain, app } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import Database from 'better-sqlite3'
import { createLogger } from './logger'
import { WUBRG_ORDER } from '../shared/mana'

const log = createLogger('db')

let db: Database.Database
const DB_NAME = 'collection.db'
// const DB_PATH = join(app.getPath('userData'), DB_NAME)
// For development, get the DB from the project root to persist across reloads
const DB_PATH = join(join(process.cwd(), 'db'), DB_NAME)

export function getDb(): Database.Database {
  return db
}

export function initDatabase(): void {
  log.info('Database initializing', { path: DB_PATH })

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  // NBM-03: Read and execute all .sql files from db/tables/ and db/views/
  const sqlDir = join(process.cwd(), 'db')
  const tables = ['cards.sql', 'scryfall_cards.sql', 'scryfall_sets.sql']
  const views = [
    'duplicates.sql',
    'missing.sql',
    'mapped_collection.sql',
    'available_cards.sql',
    'stats_summary.sql',
    'stats_colors.sql',
    'stats_rarity.sql',
    'stats_by_set.sql',
  ]

  tables.forEach((file) => {
    log.debug('Executing schema file', { file })
    const sql = readFileSync(join(sqlDir, 'tables', file), 'utf8')
    db.exec(sql)
  })

  views.forEach((file) => {
    log.debug('Executing schema file', { file })
    const sql = readFileSync(join(sqlDir, 'views', file), 'utf8')
    db.exec(sql)
  })

  log.info('Database schema initialized')
  setupIpcHandlers()
}

const VALID_RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']

function buildRarityConditions(rarities: string[] | undefined): { conditions: string[]; values: any[] } {
  const safe = (rarities ?? []).filter((r) => VALID_RARITIES.includes(r))
  if (safe.length === 0) return { conditions: [], values: [] }
  return {
    conditions: [`rarity IN (${safe.map(() => '?').join(', ')})`],
    values: safe,
  }
}

function buildColorConditions(colors: string[] | undefined, colorMode: string): { conditions: string[]; values: any[] } {
  const safe = (colors ?? []).filter((c) => WUBRG_ORDER.includes(c))
  if (safe.length === 0) return { conditions: [], values: [] }

  const conditions: string[] = []
  const values: any[] = []

  switch (colorMode) {
    case 'atLeast':
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
        WUBRG_ORDER.filter((c) => !safe.includes(c)).forEach((c) => {
          conditions.push('instr(color_identity, ?) = 0')
          values.push(c)
        })
      }
      break
  }

  return { conditions, values }
}


async function scryfallFetch(pathOrUrl: string): Promise<unknown> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `https://api.scryfall.com${pathOrUrl}`
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'blisterpod-manager/0.1' } })
  if (!res.ok) throw new Error(`Scryfall ${res.status}: ${pathOrUrl}`)
  return res.json()
}

function dbColumns(table: string): string[] {
  return (db.pragma(`table_info(${table})`) as { name: string }[]).map((r) => r.name)
}

function serializeVal(val: unknown): unknown {
  if (val === null || val === undefined) return null
  if (typeof val === 'boolean') return val ? 1 : 0
  if (typeof val === 'object') return JSON.stringify(val)
  return val
}

function buildSetValues(setJson: Record<string, unknown>, columns: string[]): Record<string, unknown> | null {
  if (!setJson.id) return null
  const row: Record<string, unknown> = {}
  for (const col of columns) {
    let val = setJson[col]
    if (col === 'code' && val != null) val = String(val).toUpperCase()
    if (col === 'parent_set_code' && val != null) val = String(val).toUpperCase()
    row[col] = serializeVal(val ?? null)
  }
  return row
}

function buildCardValues(cardJson: Record<string, unknown>, columns: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of columns) {
    let val: unknown
    if (col === 'set_code') {
      val = typeof cardJson.set === 'string' ? cardJson.set.toUpperCase() : null
    } else if (col === 'collector_number_normalised') {
      const digits = typeof cardJson.collector_number === 'string' ? cardJson.collector_number.replace(/\D/g, '') : ''
      val = digits ? parseInt(digits, 10) : null
    } else {
      val = cardJson[col]
    }
    row[col] = serializeVal(val ?? null)
  }
  return row
}

function setupIpcHandlers(): void {
  // List collection cards
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
      sortColumn = 'name',
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
      conditions.push('name LIKE ?')
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
    const rawColumn = validColumns.includes(sortColumn) ? sortColumn : 'card_name'
    const finalSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC'
    const finalSortColumn = rawColumn === 'collector_number' ? 'collector_number_normalised' : rawColumn

    query += ` ORDER BY ${finalSortColumn} ${finalSortOrder} LIMIT ? OFFSET ?`

    log.info('db:collection:list', query)

    const rows = db.prepare(query).all(...values, pageSize, offset)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM mapped_collection WHERE scryfall_id IS NOT NULL'
    if (conditions.length > 0) {
      countQuery += ` AND ${conditions.join(' AND ')}`
    }
    const { total } = db.prepare(countQuery).get(...values) as { total: number }

    return { rows, total }
  })

  // Add a card to the collection
  ipcMain.handle('db:collection:add', (_, params: {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
  }) => {
    const { set_code, collector_number, quantity_nonfoil, quantity_foil } = params
    if (quantity_nonfoil < 0 || quantity_foil < 0) {
      log.warn('Card add validation failed', { error: 'Quantities must be non-negative' })
      return { error: 'Quantities must be non-negative' }
    }
    if (quantity_nonfoil + quantity_foil === 0) {
      log.warn('Card add validation failed', { error: 'At least one copy must be owned' })
      return { error: 'At least one copy must be owned' }
    }

    const exists = db.prepare('SELECT 1 FROM available_cards WHERE set_code = ? AND collector_number = ?').get(set_code, collector_number)
    if (!exists) {
      log.warn('Card add validation failed', { error: `Card not found: ${set_code} #${collector_number}` })
      return { error: `Card not found: ${set_code} #${collector_number}` }
    }

    const insertSql = 'INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    log.info('db:collection:add', insertSql)

    const insert = db.transaction(() => {
      const result = db.prepare(insertSql).run(set_code, collector_number, quantity_nonfoil, quantity_foil)
      return { id: result.lastInsertRowid }
    })
    const result = insert()
    log.info('Card added to collection', { set_code, collector_number })
    return result
  })

  // Add multiple cards to the collection in a batch
  ipcMain.handle('db:collection:add-batch', (_, items: {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
  }[]) => {
    const insertSql = 'INSERT INTO cards (set_code, collector_number, quantity_nonfoil, quantity_foil, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    log.info('db:collection:add-batch', insertSql)

    const insertStmt = db.prepare(insertSql)
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
    log.info('Batch insert complete', { inserted, errorCount: errors.length })
    return { inserted, errors }
  })

  // Update quantities (and optionally set_code + collector_number) for a collection card
  ipcMain.handle('db:collection:update', (_, params: {
    id: number
    quantity_nonfoil: number
    quantity_foil: number
    set_code?: string
    collector_number?: string
  }) => {
    const { id, quantity_nonfoil, quantity_foil, set_code, collector_number } = params
    if (quantity_nonfoil < 0 || quantity_foil < 0) return { error: 'Quantities must be non-negative' }
    if (quantity_nonfoil + quantity_foil === 0) return { error: 'At least one copy must be owned' }
    try {
      if (set_code !== undefined && collector_number !== undefined) {
        db.prepare('UPDATE cards SET set_code = ?, collector_number = ?, quantity_nonfoil = ?, quantity_foil = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(set_code, collector_number, quantity_nonfoil, quantity_foil, id)
      } else {
        db.prepare('UPDATE cards SET quantity_nonfoil = ?, quantity_foil = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(quantity_nonfoil, quantity_foil, id)
      }
      log.debug('Collection card updated', { id })
      return { success: true as const }
    } catch (e) {
      log.error('db:collection:update failed', { error: (e as Error).message })
      return { error: (e as Error).message }
    }
  })

  // Delete a card from the collection
  ipcMain.handle('db:collection:delete', (_, params: { id: number }) => {
    const deleteSql = 'DELETE FROM cards WHERE id = ?'
    log.info('db:collection:delete', deleteSql)

    const del = db.transaction(() => {
      db.prepare(deleteSql).run(params.id)
      return { success: true }
    })
    const result = del()
    log.info('Collection card deleted', { id: params.id })
    return result
  })

  // List duplicate card entries
  ipcMain.handle('db:duplicates:list', () => {
    const sql = `SELECT * FROM duplicates ORDER BY name, set_code, collector_number`
    log.info('db:duplicates:list', sql)
    return db.prepare(sql).all()
  })

  // Merge duplicate entries
  ipcMain.handle('db:duplicates:merge', (_, params: { set_code: string; collector_number: string }) => {
    const { set_code, collector_number } = params
    log.info('db:duplicates:merge', { set_code, collector_number })

    const merge = db.transaction(() => {
      const rows = db.prepare(
        'SELECT id, quantity_nonfoil, quantity_foil FROM cards WHERE set_code = ? AND collector_number = ? ORDER BY id ASC'
      ).all(set_code, collector_number) as { id: number; quantity_nonfoil: number; quantity_foil: number }[]

      if (rows.length < 2) return { error: 'No duplicates found for this card' }

      const sumNonfoil = rows.reduce((acc, r) => acc + r.quantity_nonfoil, 0)
      const sumFoil = rows.reduce((acc, r) => acc + r.quantity_foil, 0)
      const keepId = rows[0].id
      const deleteIds = rows.slice(1).map((r) => r.id)

      db.prepare(
        'UPDATE cards SET quantity_nonfoil = ?, quantity_foil = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(sumNonfoil, sumFoil, keepId)

      db.prepare(
        `DELETE FROM cards WHERE id IN (${deleteIds.map(() => '?').join(', ')})`
      ).run(...deleteIds)

      log.info('Duplicates merged', { set_code, collector_number, kept: keepId, deleted: deleteIds })
      return { success: true as const }
    })

    try {
      return merge()
    } catch (e) {
      log.error('db:duplicates:merge failed', { error: (e as Error).message })
      return { error: (e as Error).message }
    }
  })

  // List missing cards in collection
  ipcMain.handle('db:missing:list', () => {
    const sql = `SELECT * FROM missing ORDER BY set_code, collector_number`
    log.info('db:missing:list', sql)
    return db.prepare(sql).all()
  })

  // Search available cards
  ipcMain.handle('db:cards:search', (_, params: import('../shared/search').CardSearchParams) => {
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
    log.info('db:cards:search', sql)

    const rows = db.prepare(sql).all(...values, safePageSize, offset)
    const { total } = db.prepare(`SELECT COUNT(*) as total FROM available_cards ${where}`).get(...values) as { total: number }

    return { rows, total }
  })

  // Summary stats
  ipcMain.handle('db:stats:summary', () => {
    log.info('db:stats:summary', 'SELECT * FROM stats_summary')
    const row = db.prepare('SELECT * FROM stats_summary').get() as { unique_printings: number; unique_names: number; total_cards: number; estimated_value: number }
    return {
      uniquePrintings: row.unique_printings ?? 0,
      uniqueNames: row.unique_names ?? 0,
      totalCards: row.total_cards ?? 0,
      estimatedValue: row.estimated_value ?? 0,
    }
  })

  // Color distribution stats
  ipcMain.handle('db:stats:colors', () => {
    log.info('db:stats:colors', 'SELECT * FROM stats_colors')
    return db.prepare('SELECT * FROM stats_colors').get()
  })

  // Rarity breakdown stats
  ipcMain.handle('db:stats:rarity', () => {
    const sql = `SELECT * FROM stats_rarity ORDER BY CASE rarity WHEN 'common' THEN 1 WHEN 'uncommon' THEN 2 WHEN 'rare' THEN 3 WHEN 'mythic' THEN 4 WHEN 'special' THEN 5 ELSE 6 END`
    log.info('db:stats:rarity', sql)
    const rows = db.prepare(`
      SELECT * FROM stats_rarity
      ORDER BY CASE rarity
        WHEN 'common'   THEN 1
        WHEN 'uncommon' THEN 2
        WHEN 'rare'     THEN 3
        WHEN 'mythic'   THEN 4
        WHEN 'special'  THEN 5
        ELSE 6
      END
    `).all() as { rarity: string; total_cards: number }[]
    return rows.map((r) => ({ rarity: r.rarity, totalCards: r.total_cards }))
  })

  // Top cards by EUR price
  ipcMain.handle('db:stats:top-value', (_, params: { limit?: number } = {}) => {
    const limit = Math.min(params?.limit ?? 10, 50)
    log.info('db:stats:top-value', 'SELECT * FROM mapped_collection ORDER BY value DESC LIMIT ?')
    return db.prepare('SELECT * FROM mapped_collection ORDER BY value DESC LIMIT ?').all(limit)
  })

  // Cards per set
  ipcMain.handle('db:stats:by-set', (_, params: { limit?: number } = {}) => {
    const limit = Math.min(params?.limit ?? 20, 100)
    log.info('db:stats:by-set', 'SELECT * FROM stats_by_set ORDER BY unique_printings DESC LIMIT ?')
    return db.prepare('SELECT * FROM stats_by_set ORDER BY unique_printings DESC LIMIT ?').all(limit)
  })

  // Fetch set metadata from Scryfall and upsert into scryfall_sets
  ipcMain.handle('db:missing:fetch-set', async (_, params: { set_code: string }) => {
    const { set_code } = params
    log.info('db:missing:fetch-set', { set_code })
    try {
      const setData = await scryfallFetch(`/sets/${set_code.toLowerCase()}`) as Record<string, unknown>
      const columns = dbColumns('scryfall_sets')
      const row = buildSetValues(setData, columns)
      if (!row) return { error: 'Invalid set data from Scryfall' }
      db.prepare(`INSERT OR REPLACE INTO scryfall_sets (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`).run(columns.map(c => row[c]))
      log.info('Set fetched and stored', { set_code })
      return { success: true as const }
    } catch (e) {
      log.error('db:missing:fetch-set failed', { error: (e as Error).message })
      return { error: (e as Error).message }
    }
  })

  // Fetch all cards for a set from Scryfall and upsert into scryfall_cards
  ipcMain.handle('db:missing:fetch-cards', async (_, params: { set_code: string }) => {
    const { set_code } = params
    log.info('db:missing:fetch-cards', { set_code })
    try {
      const dbRow = db.prepare('SELECT search_uri FROM scryfall_sets WHERE code = ?').get(set_code) as { search_uri: string } | undefined
      let searchUri: string
      if (dbRow?.search_uri) {
        searchUri = dbRow.search_uri
      } else {
        const setData = await scryfallFetch(`/sets/${set_code.toLowerCase()}`) as Record<string, unknown>
        if (typeof setData.search_uri !== 'string') return { error: 'search_uri not found for set' }
        searchUri = setData.search_uri
      }

      const columns = dbColumns('scryfall_cards')
      const stmt = db.prepare(`INSERT OR REPLACE INTO scryfall_cards (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`)
      const insertBatch = db.transaction((rows: Record<string, unknown>[]) => {
        for (const r of rows) stmt.run(columns.map(c => r[c]))
      })

      let url: string | null = searchUri
      let inserted = 0
      while (url) {
        const page = await scryfallFetch(url) as { data: Record<string, unknown>[]; has_more: boolean; next_page?: string }
        const rows = (page.data ?? []).map(card => buildCardValues(card, columns))
        insertBatch(rows)
        inserted += rows.length
        url = page.has_more && page.next_page ? page.next_page : null
      }

      log.info('Cards fetched and stored', { set_code, inserted })
      return { inserted }
    } catch (e) {
      log.error('db:missing:fetch-cards failed', { error: (e as Error).message })
      return { error: (e as Error).message }
    }
  })

  // Fetch a single card from Scryfall and upsert into scryfall_cards
  ipcMain.handle('db:missing:fetch-card', async (_, params: { set_code: string; collector_number: string }) => {
    const { set_code, collector_number } = params
    log.info('db:missing:fetch-card', { set_code, collector_number })
    try {
      const cardData = await scryfallFetch(`/cards/${set_code.toLowerCase()}/${collector_number}`) as Record<string, unknown>
      const columns = dbColumns('scryfall_cards')
      const row = buildCardValues(cardData, columns)
      db.prepare(`INSERT OR REPLACE INTO scryfall_cards (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`).run(columns.map(c => row[c]))
      log.info('Card fetched and stored', { set_code, collector_number })
      return { success: true as const }
    } catch (e) {
      log.error('db:missing:fetch-card failed', { error: (e as Error).message })
      return { error: (e as Error).message }
    }
  })

}
