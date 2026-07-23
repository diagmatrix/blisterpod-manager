import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { CardSearchParams } from "../../shared/search";
import { ipcMain } from "electron";
import { buildFullQuery } from "./querybuilder";
import { CardDetail, CollectionCard, ScryfallCard } from "../../shared/cards";
import { readQueryFile } from ".";

export const CARDS_SEARCH_NAME = 'cards:search'
export const CARDS_DETAIL_NAME = 'cards:detail'
export const CARDS_OTHERS_NAME = 'cards:other-printings'

const CARDS_DETAILS_QUERY = 'card_details.sql'
const CARDS_OTHERS_QUERY = 'other_printings.sql'

const logger = createLogger('db:cards')

interface ScryfallCardWithTotal extends ScryfallCard {
    total_count?: number
}

export function registerCardsHandlers(db: Database.Database): void {
    // Search available cards
    ipcMain.handle(CARDS_SEARCH_NAME, (_, params: CardSearchParams) => {
        const { sql, values } = buildFullQuery(params, 'scryfall_cards_formatted') 

        let rows: ScryfallCard[] = []
        let total = 0
        try {
            logger.info(CARDS_SEARCH_NAME, sql)
            const queryRows = db.prepare(sql).all(values) as ScryfallCardWithTotal[]

            total = queryRows[0]?.total_count ?? 0
            for (const row of queryRows) {
                delete row.total_count
            }
            rows = queryRows as ScryfallCard[]
        } catch (err) {
            logger.error(`Error fetching cards: ${err}`)
        }
        return { rows, total }
    })

    // Get card details
    ipcMain.handle(CARDS_DETAIL_NAME, (_, params: { setCode: string, collectorNumber: string}) => {
        let row: CardDetail | null = null
        try {
            const sql = readQueryFile(CARDS_DETAILS_QUERY)
            logger.info(CARDS_DETAIL_NAME, sql)
            row = db.prepare(sql).get(params.setCode, params.collectorNumber) as CardDetail
        } catch (err) {
            logger.error(`Error fetching details of card: ${err}`)
        }
        return row
    })

    // Get other printings of the same card
      ipcMain.handle(CARDS_OTHERS_NAME, (_, params: { oracleID: string, scryfallID: string }) => {
        let rows: CollectionCard[] = []
        try {
            const sql = readQueryFile(CARDS_OTHERS_QUERY)
            logger.info(CARDS_OTHERS_NAME, sql)
            rows = db.prepare(sql).all(params.oracleID, params.scryfallID) as CollectionCard[]
        } catch (err) {
            logger.error(`Error fetching other printings of card: ${err}`)
        }
        const total = rows.reduce((sum, row) => sum + (row.total as number), 0)
        return { rows, total }
      })
}
