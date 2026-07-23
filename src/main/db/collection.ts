import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import { CardSearchParams, CollectionAddParams, CollectionUpdateParams } from "../../shared/search";
import { buildFullQuery } from "./querybuilder";
import { CollectionCard } from "../../shared/cards";
import { readQueryFile } from ".";
import { AddResult, DeleteResult, InsertResult, MutationResult, PaginatedResult } from "../../shared/responses";

export const COLLECTION_LIST_NAME = 'collection:list'
export const COLLECTION_ADD_NAME = 'collection:add'
export const COLLECTION_ADD_BATCH_NAME = 'collection:add-batch'
export const COLLECTION_UPDATE_NAME = 'collection:update'
export const COLLECTION_DELETE_NAME = 'collection:delete'
export const COLLECTION_DELETE_MANY_NAME = 'collection:delete-many'

const COLLECTION_ADD_QUERY = 'card_exists.sql'
const COLLECTION_INSERT_CARD_QUERY = 'add_card.sql'
const COLLECTION_UPDATE_CARD_QUERY = 'update_card.sql'
const COLLECTION_UPDATE_CARD_FULL_QUERY = 'update_card_full.sql'

const logger = createLogger('db:collection')

interface CollectionCardWithTotal extends CollectionCard {
    total_count?: number
}

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
        const existsSQL = readQueryFile(COLLECTION_ADD_QUERY)
        logger.info(COLLECTION_ADD_NAME, existsSQL)
        const exists = db.prepare(existsSQL).get(setCode, collectorNumber)
        if (!exists) {
            const notFoundError = `Card not found on database: ${setCode} #${collectorNumber}`
            logger.warn(notFoundError)
            return notFoundError
        }
    } catch (err) {
        const dbExecutionError = `Could not verify if card exists: ${setCode} #${collectorNumber}`
        logger.error(`${dbExecutionError}: ${err}`)
        return dbExecutionError
    }
}

export function registerCollectionHandlers(db: Database.Database): void {
    // Search cards in collection
    ipcMain.handle(COLLECTION_LIST_NAME, (_, params: CardSearchParams): PaginatedResult<CollectionCard> => {
        const { sql, values } = buildFullQuery(params, 'mapped_collection', ['scryfall_id IS NOT NULL'])

        let rows: CollectionCard[] = []
        let total = 0
        try {
            logger.info(COLLECTION_LIST_NAME, sql)
            const queryRows = db.prepare(sql).all(values) as CollectionCardWithTotal[]
            total = queryRows[0]?.total_count ?? 0
            for (const row of queryRows) {
                delete row.total_count
            }
            rows = queryRows as CollectionCard[]
        } catch (err) {
            logger.error(`Error fetching cards: ${err}`)
        }
        return { rows, total }
    })

    // Add a card to the collection
    ipcMain.handle(COLLECTION_ADD_NAME, (_, params: CollectionAddParams): AddResult => {
        const paramErrors = validateAddCardParams(params)
        if (paramErrors) {
            return { error: paramErrors }
        }

        // TODO: Consider if maybe it should fail? 
        const notFoundError = checkCardExists(db, params.setCode, params.collectorNumber)

        const insertTransaction = db.transaction(() => {
            try {
                const insertSQL = readQueryFile(COLLECTION_INSERT_CARD_QUERY)
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
    ipcMain.handle(COLLECTION_ADD_BATCH_NAME, (_, items: CollectionAddParams[]): InsertResult => {
        if (items.length === 0) {
            const warningMessage = 'No cards were requested to be inserted'
            logger.warn(warningMessage)
            return { inserted: 0, warning: warningMessage }
        }
        
        const sql = readQueryFile(COLLECTION_INSERT_CARD_QUERY)
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
    ipcMain.handle(COLLECTION_UPDATE_NAME, (_, params: CollectionUpdateParams): MutationResult => {
        const paramErrors = validateAddCardParams(params)
        if (paramErrors) {
            return { success: false, error: paramErrors }
        }

        try {
            if (params.setCode !== undefined && params.collectorNumber !== undefined) {
                const sql = readQueryFile(COLLECTION_UPDATE_CARD_FULL_QUERY)
                logger.info(COLLECTION_UPDATE_NAME, sql)
                db.prepare(sql).run(params.setCode, params.collectorNumber, params.quantityNonfoil, params.quantityFoil, params.id)
            } else {
                const sql = readQueryFile(COLLECTION_UPDATE_CARD_QUERY)
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
    ipcMain.handle(COLLECTION_DELETE_NAME, (_, id: number): MutationResult => {
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
    ipcMain.handle(COLLECTION_DELETE_MANY_NAME, (_, IDs: number[]): DeleteResult => {
        if (IDs.length === 0) {
            logger.warn('No cards were requested to be deleted')
            return { deleted: 0 }
        }

        const placeholders = IDs.map(() => '?').join(', ')
        const sql = `DELETE FROM cards WHERE id IN (${placeholders})`
        logger.info(COLLECTION_DELETE_MANY_NAME, sql)

        const deleteTransaction = db.transaction((): DeleteResult => {
            try {
                const { changes } = db.prepare(sql).run(...IDs)
                return { deleted: changes }
            } catch (err) {
                logger.error(`Error deleting cards: ${err}`)
                return { deleted: 0, error: (err as Error).message }
            }
        })

        return deleteTransaction()
    })
}