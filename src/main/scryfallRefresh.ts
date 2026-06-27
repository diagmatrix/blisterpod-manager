import { Readable } from 'node:stream'
import { createRequire } from 'node:module'
import Database from 'better-sqlite3'
import { createLogger } from './logger'
import { USER_AGENT } from './utils'

// stream-json v2 is CJS-only with an "./*":"./src/*" exports wildcard that omits
// the .js suffix, breaking ESM resolution. Use createRequire + explicit .js paths.
const _require = createRequire(import.meta.url)
// withParserAsStream() returns a single Duplex: raw bytes in → {key,value} objects out
const { withParserAsStream } = _require('stream-json/streamers/stream-array.js') as {
  withParserAsStream: () => NodeJS.ReadWriteStream
}

const log = createLogger('scryfall-refresh')

const SCRYFALL_BASE = 'https://api.scryfall.com'
const WAIT_MS = 100
const BATCH_SIZE = 1000
const EXCLUDED_CODES = new Set(['UNK'])

let lastRequestAt = 0

async function scryfallGet(url: string): Promise<unknown> {
  const fullUrl = url.startsWith('http') ? url : `${SCRYFALL_BASE}${url}`
  const wait = WAIT_MS - (Date.now() - lastRequestAt)
  if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()

  const res = await fetch(fullUrl, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    throw new Error(`[${res.status}] ${body.code ?? 'http_error'}: ${body.details ?? `HTTP ${res.status}`}`)
  }
  return res.json()
}

function getColumns(db: Database.Database, table: string): string[] {
  return (db.pragma(`table_info(${table})`) as { name: string }[]).map((r) => r.name)
}

function serialize(val: unknown): unknown {
  if (val === null || val === undefined) return null
  if (typeof val === 'boolean') return val ? 1 : 0
  if (typeof val === 'object') return JSON.stringify(val)
  return val
}

function buildSetRow(setJson: Record<string, unknown>, columns: string[]): Record<string, unknown> | null {
  if (!setJson.id) return null
  const row: Record<string, unknown> = {}
  for (const col of columns) {
    let val = setJson[col]
    if (col === 'code' && val != null) val = String(val).toUpperCase()
    if (col === 'parent_set_code' && val != null) val = String(val).toUpperCase()
    row[col] = serialize(val ?? null)
  }
  return row
}

function buildCardRow(cardJson: Record<string, unknown>, columns: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of columns) {
    let val: unknown
    if (col === 'set_code') {
      val = typeof cardJson.set === 'string' ? cardJson.set.toUpperCase() : null
    } else if (col === 'collector_number_normalised') {
      const digits = typeof cardJson.collector_number === 'string'
        ? cardJson.collector_number.replace(/\D/g, '')
        : ''
      val = digits ? parseInt(digits, 10) : null
    } else {
      val = cardJson[col]
    }
    row[col] = serialize(val ?? null)
  }
  return row
}

export async function refreshSets(db: Database.Database): Promise<{ inserted: number }> {
  log.info('Starting set refresh from Scryfall')

  const columns = getColumns(db, 'scryfall_sets')
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO scryfall_sets (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  )
  const insertBatch = db.transaction((rows: Record<string, unknown>[]) => {
    for (const row of rows) stmt.run(columns.map((c) => row[c]))
  })

  let url: string | null = '/sets'
  let inserted = 0

  while (url) {
    const page = (await scryfallGet(url)) as { data: Record<string, unknown>[]; has_more: boolean; next_page?: string }

    const rows: Record<string, unknown>[] = []
    for (const setJson of page.data ?? []) {
      if (setJson.digital) continue
      const row = buildSetRow(setJson, columns)
      if (!row || EXCLUDED_CODES.has(String(row.code))) continue
      rows.push(row)
    }

    insertBatch(rows)
    inserted += rows.length
    url = page.has_more && page.next_page ? page.next_page : null
  }

  log.info('Set refresh complete', { inserted })
  return { inserted }
}

export async function refreshCards(db: Database.Database): Promise<{ inserted: number }> {
  log.info('Starting card refresh from Scryfall')

  const meta = (await scryfallGet('/bulk-data/default_cards')) as { download_uri?: string }
  const downloadUri = meta.download_uri
  if (!downloadUri) throw new Error('download_uri not found in bulk-data response')

  const columns = getColumns(db, 'scryfall_cards')
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO scryfall_cards (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  )
  const insertBatch = db.transaction((rows: Record<string, unknown>[]) => {
    for (const row of rows) stmt.run(columns.map((c) => row[c]))
  })

  log.info('Downloading bulk card data', { uri: downloadUri })
  const response = await fetch(downloadUri, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!response.ok) throw new Error(`Failed to download bulk data: ${response.status}`)
  if (!response.body) throw new Error('Response body is null')

  const nodeStream = Readable.fromWeb(response.body as any)
  const jsonStream = nodeStream.pipe(withParserAsStream()) as AsyncIterable<{ key: number; value: unknown }>

  let batch: Record<string, unknown>[] = []
  let inserted = 0

  for await (const { value } of jsonStream) {
    const card = value as Record<string, unknown>
    if (!card.id) continue
    if (card.digital) continue
    if (typeof card.set === 'string' && EXCLUDED_CODES.has(card.set.toUpperCase())) continue

    batch.push(buildCardRow(card, columns))

    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch)
      inserted += batch.length
      log.debug('Card batch inserted', { inserted })
      batch = []
    }
  }

  if (batch.length > 0) {
    insertBatch(batch)
    inserted += batch.length
  }

  log.info('Card refresh complete', { inserted })
  return { inserted }
}
