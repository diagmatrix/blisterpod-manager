import Database from "better-sqlite3"
import { createLogger } from "../logger"
import { ipcMain } from "electron"
import { readQueryFile } from "."
import { DuplicateCard, DuplicateCardInstance, DuplicateCardRow } from "../../models/cards"
import {
    DUPLICATES_LIST_NAME,
    DUPLICATES_IDS_NAME,
    DUPLICATES_MERGE_NAME,
    DUPLICATES_FULL_MERGE_NAME,
    DUPLICATES_DELETE_NAME,
} from "../../models/channels"

const DUPLICATES_LIST_QUERY = 'all_duplicates.sql'
const DUPLICATES_MERGE_QUERY = 'duplicates_set_number.sql'
const DUPLICATES_MERGE_ALL_QUERY = 'all_duplicates_merge.sql'
const DUPLICATES_DELETE_QUERY = 'delete_duplicates.sql'

const logger = createLogger('db:duplicates')

function getDuplicatesFromSetNumber(db: Database.Database, setCode: string, collectorNumber: string): DuplicateCardRow[] {
    let rows: DuplicateCardRow[] = []
    try {
        const sql = readQueryFile(DUPLICATES_MERGE_QUERY)
        logger.info('Getting duplicates from set and number', sql)
        rows = db.prepare(sql).all(setCode, collectorNumber) as DuplicateCardRow[]
    } catch (err) {
        logger.error(`Error fetching duplicates from set and number: ${err}`)
    }
    return rows
}

function removeDuplicatesFromDB(db: Database.Database): { deleted: number, error?: string } {
    const removeFromDBTransaction = db.transaction(() => {
        try {
            const sql = readQueryFile(DUPLICATES_DELETE_QUERY)
            logger.info('Removing all duplicates', sql)
            const { changes } = db.prepare(sql).run()
            return { deleted: changes }
        } catch (err) {
            return { deleted: 0, error: (err as Error).message }
        }
    })

    return removeFromDBTransaction()
}

export function registerDuplicateCardsHandlers(db: Database.Database): void {
    // List duplicate cards
    ipcMain.handle(DUPLICATES_LIST_NAME, () => {
        let rows: DuplicateCard[] = []
        try {
            const sql = readQueryFile(DUPLICATES_LIST_QUERY)
            logger.info(DUPLICATES_LIST_NAME, sql)
            rows = db.prepare(sql).all() as DuplicateCard[]
        } catch (err) {
            logger.error(`Error fetching duplicate cards: ${err}`)
        }
        return rows
    })

    // Fetch cards from a list of IDs for duplicate grouping
    ipcMain.handle(DUPLICATES_IDS_NAME, (_, cardIDs: number[]) => {
        let rows: DuplicateCardInstance[] = []
        if (!cardIDs.length || cardIDs.length === 0) {
            logger.warn('No card IDs where requested from the database')
            return rows
        }

        try {
            const placeholders = cardIDs.map(() => '?').join(', ')
            const sql = `SELECT id, quantity_nonfoil, quantity_foil, created_at, updated_at FROM cards WHERE id IN (${placeholders}) ORDER BY id ASC`
            logger.info(DUPLICATES_IDS_NAME, sql) 
            rows = db.prepare(sql).all(...cardIDs) as DuplicateCardInstance[]
        } catch (err) {
            logger.error(`Error fetching duplicate cards from list of IDs: ${err}`)
        }
        return rows
    })

    // Merge duplicate entries for a card
    ipcMain.handle(DUPLICATES_MERGE_NAME, (_, params: { setCode: string, collectorNumber: string}) => {
        const mergeTransaction = db.transaction(() => {
            const duplicates = getDuplicatesFromSetNumber(db, params.setCode, params.collectorNumber)
            if (duplicates.length < 2) {
                return { error: 'No duplicates found for this card' }
            }

            const sumQuantites = duplicates.reduce((sums, row) => {
                return { nonfoil: sums.nonfoil + row.quantity_nonfoil, foil: sums.foil + row.quantity_foil }
            }, { nonfoil: 0, foil: 0 })
            const keepID = duplicates[0].id
            try {
                const updateSQL = 'UPDATE cards SET quantity_nonfoil = ?, quantity_foil = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                logger.info(DUPLICATES_MERGE_NAME, updateSQL)
                db.prepare(updateSQL).run(sumQuantites.nonfoil, sumQuantites.foil, keepID)
            } catch (err) {
                return { error: (err as Error).message }
            }
            
            const deleteIDs = duplicates.slice(1).map((row) => row.id)
            try {
                const deleteSQL = `DELETE FROM cards WHERE id IN (${deleteIDs.map(() => '?').join(', ')})`
                logger.info(DUPLICATES_MERGE_NAME, deleteSQL)
                db.prepare(deleteSQL).run(...deleteIDs)
            } catch (err) {
                return { error: (err as Error).message }
            }
        })

        const result = mergeTransaction()
        if (result?.error) {
            return { success: false, error: result.error }
        }

        return { success: true }
    })

    // Merge all duplicates
    ipcMain.handle(DUPLICATES_FULL_MERGE_NAME, () => {
        const mergeAllTransaction = db.transaction(() => {
            let merged: number = 0
            try {
                const sql = readQueryFile(DUPLICATES_MERGE_ALL_QUERY)
                logger.info(DUPLICATES_FULL_MERGE_NAME, sql)
                const { changes } = db.prepare(sql).run()
                merged = changes
            } catch (err) {
                return { merged: merged, error: (err as Error).message }
            }

            const { error } = removeDuplicatesFromDB(db)
            if (error) {
                return { merged: 0, error: error}
            }

            return { merged: merged }
        })

        return mergeAllTransaction()
    })

    // Remove all duplicates
    ipcMain.handle(DUPLICATES_DELETE_NAME, () => {
        return removeDuplicatesFromDB(db)
    })
}