import Database from "better-sqlite3"
import { createLogger } from "../logger"
import { ipcMain } from "electron"
import { MissingCard } from "../../shared/cards"
import { readQueryFile } from "."
import { getCard, getSet, getSetCards } from "../scryfallRefresh"
import { CardDetailParams, SetCodeParams } from "../../shared/search"
import { InsertResult, MutationResult } from "../../shared/responses"

export const MISSING_LIST_NAME = 'missing:list'
export const MISSING_FETCH_SET_NAME = 'missing:fetch-set'
export const MISSING_FETCH_SET_CARDS_NAME = 'missing:fetch-cards'
export const MISSING_FETCH_CARD_NAME = 'missing:fetch-card'

const MISSING_LIST_QUERY = 'missing.sql'
const MISSING_FETCH_SET_CARDS_QUERY = 'search_uri.sql'

const logger = createLogger('db:missing')

export function registerMissingCardsHandlers(db: Database.Database): void {
    // List missing cards in collection
    ipcMain.handle(MISSING_LIST_NAME, () => {
        let rows: MissingCard[] = []
        try {
            const sql = readQueryFile(MISSING_LIST_QUERY)
            logger.info(MISSING_LIST_NAME, sql)
            rows = db.prepare(sql).all() as MissingCard[]
        } catch (err) {
            logger.error(`Error fetching missing cards: ${err}`)
        }
        return rows
    })

    // Fetch and store a set from Scryfall
    ipcMain.handle(MISSING_FETCH_SET_NAME, async (_, params: SetCodeParams): Promise<MutationResult> => {
        try {
            const success = await getSet(db, params.setCode)
            logger.info(MISSING_FETCH_SET_NAME, 'Successful')
            return { success }
        } catch (err) {
            logger.error(`Error fetching set: ${err}`)
            return { success: false, error: (err as Error).message }
        }
    })

    // Fetch and store the cards from a set
    ipcMain.handle(MISSING_FETCH_SET_CARDS_NAME, async (_, params: SetCodeParams): Promise<InsertResult> => {
        let searchUri: string | undefined
        try {
            const sql = readQueryFile(MISSING_FETCH_SET_CARDS_QUERY)
            logger.info(MISSING_FETCH_SET_CARDS_NAME, sql)
            const dbRow = db.prepare(sql).get(params.setCode.toUpperCase()) as { search_uri: string } | undefined
            if (dbRow?.search_uri) {
                searchUri = dbRow.search_uri
            }
        } catch (err) {
            logger.error(`Error fetching missing cards: ${err}`)
            return { inserted: 0, error: (err as Error).message }
        }

        if (!searchUri) {
            const errorMessage = 'Set missing or set missing search URL'
            logger.error(errorMessage)
            return { inserted: 0, error: errorMessage }
        }

        const { inserted, error } = await getSetCards(db, searchUri)
        return { inserted: inserted, error: error }
    })

    // Fetch and store a card from Scryfall
    ipcMain.handle(MISSING_FETCH_CARD_NAME, async (_, params: CardDetailParams): Promise<MutationResult> => {
        try {
            const success = await getCard(db, params.setCode, params.collectorNumber)
            logger.info(MISSING_FETCH_CARD_NAME, 'Successful')
            return { success }
        } catch (err) {
            logger.error(`Error fetching card: ${err}`)
            return { success: false, error: (err as Error).message }
        }
    })
}
