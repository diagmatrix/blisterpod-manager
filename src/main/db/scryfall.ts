import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { SCRYFALL_REFRESH_CARDS_NAME, SCRYFALL_REFRESH_SETS_NAME } from "../../models/channels";
import { ipcMain } from "electron";
import { getTableColumns, isEmpty } from "../utils";
import {
    buildCardRow,
    buildSetRow,
    fetchAllSets,
    fetchCard,
    fetchSearchPages,
    fetchSet,
    streamBulkCards,
} from "../scryfallRefresh";
import { InsertResult } from "../../models/responses";

const BATCH_SIZE = 1000
const EXCLUDED_CODES = new Set(['UNK'])
const SET_TABLE_NAME = 'scryfall_sets'
const CARD_TABLE_NAME = 'scryfall_cards'

const logger = createLogger('db:scryfall')

interface Inserter {
    columns: string[]
    insertBatch: (rows: Record<string, unknown>[]) => void
}

function buildInserter(db: Database.Database, tableName: string): Inserter {
    const columns = getTableColumns(db, tableName)
    const placeholders = columns.map(() => '?').join(', ')
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`)

    const insertBatch = db.transaction((rows: Record<string, unknown>[]) => {
        for (const row of rows) {
            stmt.run(columns.map((c) => row[c]))
        }
    })

    return { columns, insertBatch }
}

export async function refreshSets(db: Database.Database, excludedCodes: string[] = []): Promise<InsertResult> {
    logger.info('Starting set refresh from Scryfall')

    const excludedSets = new Set([...EXCLUDED_CODES, ...excludedCodes.map((code) => code.toUpperCase())])
    const { columns, insertBatch } = buildInserter(db, SET_TABLE_NAME)

    let batch: Record<string, unknown>[] = []
    let inserted = 0

    for await (const setJson of fetchAllSets()) {
        // Skip digital sets
        if (setJson.digital) {
            continue
        }

        const row = buildSetRow(setJson, columns)
        // Skip empty rows and excluded sets
        if (isEmpty(row) || excludedSets.has(String(row.code))) {
            continue
        }

        batch.push(row)
        if (batch.length >= BATCH_SIZE) {
            insertBatch(batch)
            inserted += batch.length
            batch = []
        }
    }

    if (batch.length > 0) {
        insertBatch(batch)
        inserted += batch.length
    }

    logger.info('Set refresh complete', { inserted })
    return { inserted }
}

export async function refreshCards(db: Database.Database, excludedCodes: string[] = []): Promise<InsertResult> {
    logger.info('Starting card refresh from Scryfall')

    const excludedSets = new Set([...EXCLUDED_CODES, ...excludedCodes.map((code) => code.toUpperCase())])
    const { columns, insertBatch } = buildInserter(db, CARD_TABLE_NAME)

    let batch: Record<string, unknown>[] = []
    let inserted = 0

    for await (const card of streamBulkCards()) {
        if (!card.id || card.digital) {
            continue
        }
        if (typeof card.set === 'string' && excludedSets.has(card.set.toUpperCase())) {
            continue
        }

        batch.push(buildCardRow(card, columns))

        if (batch.length >= BATCH_SIZE) {
            insertBatch(batch)
            inserted += batch.length
            logger.debug('Card batch inserted', { inserted })
            batch = []
        }
    }

    if (batch.length > 0) {
        insertBatch(batch)
        inserted += batch.length
    }

    logger.info('Card refresh complete', { inserted })
    return { inserted }
}

export async function getSet(db: Database.Database, setCode: string): Promise<boolean> {
    logger.info('Starting set retrieval from Scryfall')

    let setToInsert: Record<string, unknown> = {}
    let inserter: Inserter
    try {
        inserter = buildInserter(db, SET_TABLE_NAME)
        setToInsert = buildSetRow(await fetchSet(setCode), inserter.columns)
        if (isEmpty(setToInsert)) {
            throw new Error('Unable to build set')
        }
    } catch (err) {
        logger.error('Failed to retrieve and build set')
        return Promise.reject(`Set could not be fetched: ${err}`)
    }

    try {
        inserter.insertBatch([setToInsert])
        logger.info('Set stored in database')
        return true
    } catch (err) {
        logger.error('Failed to store set in databse')
        return Promise.reject(`Set could not be stored in database: ${err}`)
    }
}

export async function getSetCards(db: Database.Database, searchURI: string): Promise<InsertResult> {
    logger.info('Starting card retrieval from Scryfall')

    const { columns, insertBatch } = buildInserter(db, CARD_TABLE_NAME)

    let batch: Record<string, unknown>[] = []
    let inserted = 0
    let error: string | undefined

    // Whatever was fetched before a failure is kept, matching the previous page-by-page
    // behaviour where earlier pages stayed committed.
    try {
        for await (const card of fetchSearchPages(searchURI)) {
            batch.push(buildCardRow(card, columns))

            if (batch.length >= BATCH_SIZE) {
                insertBatch(batch)
                inserted += batch.length
                batch = []
            }
        }
    } catch (err) {
        logger.error(`Error retrieving and inserting batch: ${err}`)
        error = (err as Error).message
    }

    if (batch.length > 0) {
        insertBatch(batch)
        inserted += batch.length
    }

    logger.info('Cards fetched and stored in databse')
    return { inserted, error }
}

export async function getCard(db: Database.Database, setCode: string, collectorNumber: string): Promise<boolean> {
    logger.info('Starting card retrieval from Scryfall')

    let cardToInsert: Record<string, unknown> = {}
    let inserter: Inserter
    try {
        inserter = buildInserter(db, CARD_TABLE_NAME)
        cardToInsert = buildCardRow(await fetchCard(setCode, collectorNumber), inserter.columns)
        if (isEmpty(cardToInsert)) {
            throw new Error('Unable to build card')
        }
    } catch (err) {
        logger.error('Failed to retrieve and build card')
        return Promise.reject(`Card could not be fetched: ${err}`)
    }

    try {
        inserter.insertBatch([cardToInsert])
        logger.info('Card stored in database')
        return true
    } catch (err) {
        logger.error('Failed to store card in databse')
        return Promise.reject(`Card could not be stored in database: ${err}`)
    }
}

export function registerScryfallHandlers(db: Database.Database): void {
    // Refresh the available cards
    ipcMain.handle(SCRYFALL_REFRESH_CARDS_NAME, async (_, excludedCodes: string[] = []): Promise<InsertResult> => {
        try {
            return await refreshCards(db, excludedCodes)
        } catch (err) {
            logger.error(`Error refreshing cards: ${err}`)
            return { inserted: 0, error: (err as Error).message }
        }
    })

    // Refresh the available sets
    ipcMain.handle(SCRYFALL_REFRESH_SETS_NAME, async (_, excludedCodes: string[] = []): Promise<InsertResult> => {
        try {
            return await refreshSets(db, excludedCodes)
        } catch (err) {
            logger.error(`Error refreshing sets: ${err}`)
            return { inserted: 0, error: (err as Error).message }
        }
    })
}
