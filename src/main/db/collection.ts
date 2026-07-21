import Database, { Statement } from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import { CardSearchParams, CollectionAddParams, CollectionUpdateParams } from "../../shared/search";
import { buildFullQuery } from "./querybuilder";
import { CollectionCard } from "../../shared/cards";
import { getQueryFilePath } from ".";

const COLLECTION_LIST_NAME = 'collection:list'
const COLLECTION_ADD_NAME = 'collection:add'
const COLLECTION_ADD_BATCH_NAME = 'collection:add-batch'
const COLLECTION_UPDATE_NAME = 'collection:update'
const COLLECTION_DELETE_NAME = 'collection:delete'
const COLLECTION_DELETE_MANY_NAME = 'collection:delete-many'

const COLLECTION_ADD_QUERY = 'card_exists.sql'
const COLLECTION_INSERT_CARD_QUERY = 'add_card.sql'
const COLLECTION_UPDATE_CARD_QUERY = 'update_card.sql'
const COLLECTION_UPDATE_CARD_FULL_QUERY = 'update_full_card.sql'

const logger = createLogger('db:collection')

function validateAddCardParams(params: CollectionAddParams | CollectionUpdateParams): string | undefined {
    if (params.quantityNonfoil < 0 || params.quantityFoil < 0) {
        const errorMessage = 'Error adding cards: quantities must be non-negative'
        logger.error(errorMessage)
        return errorMessage
    } else if (params.quantityNonfoil + params.quantityFoil === 0) {
        const errorMessage = 'Error adding cards: at least one copy must be owned'
        logger.error(errorMessage)
        return errorMessage
    }
}

function checkCardExists(db: Database.Database, setCode: string, collectorNumber: string): string | undefined {
    try {
        const existsSQL = getQueryFilePath(COLLECTION_ADD_QUERY)
        logger.info(COLLECTION_ADD_NAME, existsSQL)
        const exists = db.prepare(existsSQL).get(setCode, collectorNumber)
        if (!exists) {
            const notFoundError = `Card not found on database: ${setCode} #${collectorNumber}`
            logger.warn(notFoundError)
            return notFoundError
        }
    } catch (err) {
        logger.error(`Error trying to validate if card exists: ${err}`)
    }
}

export function registerCollectionHandlers(db: Database.Database): void {
    // Search cards in collection
    ipcMain.handle(COLLECTION_LIST_NAME, (_, params: CardSearchParams) => {
        const { sql, values } = buildFullQuery(params, 'mapped_collection', ['scryfall_id IS NOT NULL'])

        let rows: CollectionCard[] = []
        try {
            logger.info(COLLECTION_LIST_NAME, sql)
            rows = db.prepare(sql).all(values) as CollectionCard[]
        } catch (err) {
            logger.error(`Error fetching cards: ${err}`)
        } finally {
            const total = rows.length ?? 0
            return { rows, total }
        }
    })

    // Add a card to the collection
    ipcMain.handle(COLLECTION_ADD_NAME, (_, params: CollectionAddParams) => {
        const paramErrors = validateAddCardParams(params)
        if (paramErrors) {
            return { error: paramErrors }
        }

        // TODO: Consider if maybe it should fail? 
        const notFoundError = checkCardExists(db, params.setCode, params.collectorNumber)

        const insertTransaction = db.transaction(() => {
            try {
                const insertSQL = getQueryFilePath(COLLECTION_INSERT_CARD_QUERY)
                logger.info(COLLECTION_ADD_NAME, insertSQL)
                const result = db.prepare(insertSQL).run(params.setCode, params.collectorNumber, params.quantityNonfoil, params.quantityFoil)
                return { cardID: result.lastInsertRowid }
            } catch (err) {
                return { error: `Card could not be inserted: ${err}`}
            }
        })

        const { cardID, error } = insertTransaction()
        if (error) {
            return { error: error, warning: notFoundError }
        } else {
            return { id: cardID, warning: notFoundError }
        }
    })

    // Add a batch of cards to the collection
    ipcMain.handle(COLLECTION_ADD_BATCH_NAME, (_, items: CollectionAddParams[]) => {
        if (items.length === 0) {
            const warningMessage = 'No cards were requested to be inserted'
            logger.warn(warningMessage)
            return { inserted: 0, warning: warningMessage }
        }
        
        const sql = getQueryFilePath(COLLECTION_INSERT_CARD_QUERY)
        logger.info(COLLECTION_ADD_BATCH_NAME, sql)
        const dbStatement = db.prepare(sql)

        let inserted = 0
        const errors: string[] = []
        const warnings: string[] = []
        const batchInsertTransaction = db.transaction(() => {
            items.forEach((params) => {
                const paramErrors = validateAddCardParams(params)
                if (paramErrors) {
                    errors.push(paramErrors)
                } else {
                    const notFoundError = checkCardExists(db, params.setCode, params.collectorNumber)
                    if (notFoundError) {
                        warnings.push(notFoundError)
                    }

                    try {
                        dbStatement.run(params.setCode, params.collectorNumber, params.quantityNonfoil, params.quantityFoil)
                        inserted++
                    } catch (err) {
                        errors.push(`Error inserting ${params.setCode} #${params.collectorNumber}: ${err}`)
                    }
                }
            })
        })

        batchInsertTransaction()
        return { inserted: inserted, error: errors.join(', '), warning: warnings.join(', ') }
    })

    // Update a card in the collection
    ipcMain.handle(COLLECTION_UPDATE_NAME, (_, params: CollectionUpdateParams) => {
        const paramErrors = validateAddCardParams(params)
        if (paramErrors) {
            return { success: false, error: paramErrors }
        }

        try {
            if (params.setCode !== undefined && params.collectorNumber !== undefined) {
                const sql = getQueryFilePath(COLLECTION_UPDATE_CARD_FULL_QUERY)
                logger.info(COLLECTION_UPDATE_NAME, sql)
                db.prepare(sql).run(params.setCode, params.collectorNumber, params.quantityNonfoil, params.quantityFoil, params.id)
            } else {
                const sql = getQueryFilePath(COLLECTION_UPDATE_CARD_QUERY)
                logger.info(COLLECTION_UPDATE_NAME, sql)
                db.prepare(sql).run(params.quantityNonfoil, params.quantityFoil, params.id)
            }
            return { success: true }
        } catch (err) {
            logger.error(`Error updating card: ${err}`)
            return { success: false, error: (err as Error).message }
        }
    })

    // Delete a card of the collection
    ipcMain.handle(COLLECTION_DELETE_NAME, (_, id: number) => {
        const sql = 'DELETE FROM cards WHERE id = ?'
        logger.info(COLLECTION_DELETE_NAME, sql)

        const deleteTransaction = db.transaction(() => {
            try {
                db.prepare(sql).run(id)
                return { success: true }
            } catch (err) {
                logger.error(`Error deleting card: ${err}`)
                return { success: false, error: (err as Error).message }
            }
        })

        return deleteTransaction()
    })

    // Delete multiple cards from the collection
    ipcMain.handle(COLLECTION_DELETE_MANY_NAME, (_, IDs: number[]) => {
        if (IDs.length === 0) {
            logger.warn('No cards were requested to be deleted')
            return { deleted: 0 }
        }

        const placeholders = IDs.map(() => '?').join(', ')
        const sql = `DELETE FROM cards WHERE id IN (${placeholders})`
        logger.info(COLLECTION_DELETE_MANY_NAME, sql)
        
        const deleteTransaction = db.transaction(() => {
            try {
                db.prepare(sql).run(...IDs)
                return { success: true }
            } catch (err) {
                logger.error(`Error deleting cards: ${err}`)
                return { success: false, error: (err as Error).message }
            }
        })

        return deleteTransaction()
    })
}