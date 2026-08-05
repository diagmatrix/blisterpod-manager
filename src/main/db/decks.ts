import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import {
    DECKS_LIST_NAME,
    DECKS_CREATE_NAME,
    DECKS_DETAIL_NAME,
} from "../../models/channels";
import { Deck, DeckFolder, groupByFolder, InsertDeckParams } from "../../models/decks";
import { MutationResult, PaginatedResult } from "../../models/responses";
import { readQueryFile } from ".";

const DECKS_CREATE_QUERY = 'create_deck.sql'

const logger = createLogger('db:decks')

function validateInsertDeckParams(params: InsertDeckParams): string | undefined {
    if (!params.name || params.name.trim() === '') {
        const errorMessage = 'Error creating deck: name is required'
        logger.error(errorMessage)
        return errorMessage
    }

    if (params.in_use !== undefined && typeof params.in_use !== 'boolean') {
        const errorMessage = 'Error creating deck: in_use must be a boolean'
        logger.error(errorMessage)
        return errorMessage
    }
}

export function registerDecksHandlers(db: Database.Database): void {
    // List decks
    ipcMain.handle(DECKS_LIST_NAME, (): PaginatedResult<DeckFolder> => {
        const sql = 'SELECT * FROM decks ORDER BY folder ASC NULLS LAST, name ASC'

        let rows: DeckFolder[] = []
        let total = 0
        try {
            logger.info(DECKS_LIST_NAME, sql)
            const decks: Deck[] = (db.prepare(sql).all() as Deck[]).map((deck) => ({
                ...deck,
                in_use: Boolean(deck.in_use),
            }))
            rows = groupByFolder(decks)
            total = decks.length
        } catch (error) {
            logger.error(DECKS_LIST_NAME, error)
        }
        return { rows, total }
    })

    // Create deck
    ipcMain.handle(DECKS_CREATE_NAME, (_, params: InsertDeckParams): MutationResult => {
        const errorMessage = validateInsertDeckParams(params)
        if (errorMessage) {
            return { success: false, error: errorMessage }
        }

        try {
            const sql = readQueryFile(DECKS_CREATE_QUERY)
            logger.info(DECKS_CREATE_NAME, sql)
            db.prepare(sql).run(params.name, params.format ?? null, params.folder ?? null, params.in_use ? 1 : 0)
            return { success: true }
        } catch (error) {
            logger.error(DECKS_CREATE_NAME, error)
            return { success: false, error: 'Error creating deck' }
        }
    })

    // Get deck details
    ipcMain.handle(DECKS_DETAIL_NAME, (_, deckId: string): Deck | null => {
        const sql = 'SELECT * FROM decks WHERE id = ?'
        try {
            logger.info(DECKS_DETAIL_NAME, sql)
            const deck = db.prepare(sql).get(deckId) as Deck | undefined
            if (!deck) {
                logger.warn(DECKS_DETAIL_NAME, `Deck with id ${deckId} not found`)
                return null
            }
            return {
                ...deck,
                in_use: Boolean(deck.in_use),
            }
        } catch (error) {
            logger.error(DECKS_DETAIL_NAME, error)
            return null
        }
    })
}
