import { Readable } from 'node:stream'
import { createRequire } from 'node:module'
import Database from 'better-sqlite3'
import { createLogger } from './logger'
import { getTableColumns, isEmpty, serializeVal, USER_AGENT } from './utils'

interface Inserted {
    inserted: number
    error?: string
}

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
const SET_TABLE_NAME = 'scryfall_sets'
const CARD_TABLE_NAME = 'scryfall_cards'

let lastRequestAt = 0

async function scryfallGet(url: string): Promise<unknown> {
    const fullUrl = url.startsWith('http') ? url : `${SCRYFALL_BASE}${url}`

    const wait = WAIT_MS - (Date.now() - lastRequestAt)
    if (wait > 0) {
        await new Promise<void>((r) => setTimeout(r, wait))
    }
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

function buildSetRow(setJson: Record<string, unknown>, columns: string[]): Record<string, unknown> {
    const row: Record<string, unknown> = {}

    if (setJson.id) {
        for (const col of columns) {
            let val = setJson[col]
            if (col === 'code' && val != null) {
                val = String(val).toUpperCase()
            }
            if (col === 'parent_set_code' && val != null) {
                val = String(val).toUpperCase()
            }

            row[col] = serializeVal(val ?? null)
        }
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
        row[col] = serializeVal(val ?? null)
    }
    return row
}

export async function refreshSets(db: Database.Database): Promise<Inserted> {
    log.info('Starting set refresh from Scryfall')

    const columns = getTableColumns(db, 'scryfall_sets')
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
            if (!isEmpty(row) || !EXCLUDED_CODES.has(String(row.code))) {
                rows.push(row)
            }
        }

        insertBatch(rows)
        inserted += rows.length
        url = page.has_more && page.next_page ? page.next_page : null
    }

    log.info('Set refresh complete', { inserted })
    return { inserted }
}

export async function refreshCards(db: Database.Database): Promise<Inserted> {
    log.info('Starting card refresh from Scryfall')

    const meta = (await scryfallGet('/bulk-data/default_cards')) as { download_uri?: string }
    const downloadUri = meta.download_uri
    if (!downloadUri) throw new Error('download_uri not found in bulk-data response')

    const columns = getTableColumns(db, 'scryfall_cards')
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

export async function getSet(db: Database.Database, setCode: string): Promise<boolean> {
    log.info('Starting set retrieval from Scryfall')
    const url = `/sets/${setCode.toLowerCase()}`

    let setToInsert: Record<string, unknown> = {}
    let dbColumns: string[] = []
    try {
        dbColumns = getTableColumns(db, SET_TABLE_NAME)
        const scryfallSet = await scryfallGet(url) as Record<string, unknown>
        setToInsert = buildSetRow(scryfallSet, dbColumns)
        if (isEmpty(setToInsert)) {
            throw new Error('Unable to build set')
        }
    } catch (err) {
        log.error('Failed to retrieve and build set')
        return Promise.reject(`Set could not be fetched: ${err}`)
    }

    const sql = `INSERT OR REPLACE INTO scryfall_sets (${dbColumns.join(', ')}) VALUES (${dbColumns.map(() => '?').join(', ')})`
    const values = dbColumns.map((col) => setToInsert[col])
    try {
        db.prepare(sql).run(values)
        log.info('Set stored in database')
        return true
    } catch (err) {
        log.error('Failed to store set in databse')
        return Promise.reject(`Set could not be stored in database: ${err}`)
    }
}

export async function getSetCards(db: Database.Database, searchURI: string): Promise<Inserted> {
    log.info('Starting card retrieval from Scryfall')

    const dbColumns = getTableColumns(db, CARD_TABLE_NAME)
    const stmt = db.prepare(`INSERT OR REPLACE INTO scryfall_cards (${dbColumns.join(', ')}) VALUES (${dbColumns.map(() => '?').join(', ')})`)
    const insertTransaction = db.transaction((rows: Record<string, unknown>[]) => {
        for (const r of rows) {
            stmt.run(dbColumns.map(c => r[c]))
        }
    })

    let inserted = 0
    let scryfallURL: string | undefined = searchURI
    let errors: string | undefined
    while (scryfallURL) {
        try {
            const page = await scryfallGet(scryfallURL) as { data: Record<string, unknown>[]; has_more: boolean; next_page?: string }
            const cards = (page.data ?? []).map(card => buildCardRow(card, dbColumns))
            insertTransaction(cards)

            inserted += cards.length
            if (page.has_more) {
                scryfallURL = page.next_page
            }
        } catch (err) {
            log.error(`Error retrieving and inserting batch: ${err}`)
            if (!errors) {
                errors = (err as Error).message
            } else {
                errors += `, ${(err as Error).message}`
            }

            scryfallURL = undefined
        }
    }

    log.info('Cards fetched and stored in databse')
    return {inserted: inserted, error: errors}
}

export async function getCard(db: Database.Database, setCode: string, collectorNumber: string): Promise<boolean> {
    log.info('Starting card retrieval from Scryfall')
    const url = `/cards/${setCode.toLowerCase()}/${collectorNumber}`

    let cardToInsert: Record<string, unknown> = {}
    let dbColumns: string[] = []
    try {
        dbColumns = getTableColumns(db, CARD_TABLE_NAME)
        const scryfallSet = await scryfallGet(url) as Record<string, unknown>
        cardToInsert = buildCardRow(scryfallSet, dbColumns)
        if (isEmpty(cardToInsert)) {
            throw new Error('Unable to build card')
        }
    } catch (err) {
        log.error('Failed to retrieve and build card')
        return Promise.reject(`Card could not be fetched: ${err}`)
    }

    const sql = `INSERT OR REPLACE INTO scryfall_cards (${dbColumns.join(', ')}) VALUES (${dbColumns.map(() => '?').join(', ')})`
    const values = dbColumns.map((col) => cardToInsert[col])
    try {
        db.prepare(sql).run(values)
        log.info('Card stored in database')
        return true
    } catch (err) {
        log.error('Failed to store card in databse')
        return Promise.reject(`Card could not be stored in database: ${err}`)
    }
}
