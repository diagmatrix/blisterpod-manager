import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import { readQueryFile } from ".";
import { writeFileSync } from "fs";
import { csvQuote } from "../utils";
import {
    COLLECTION_EXPORT_NAME,
    COLLECTION_EXPORT_MOXFIELD_NAME,
    COLLECTION_EXPORT_MANABOX_NAME,
} from "../../models/channels";

interface CollectionRow {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
}

interface BlisterpodRow extends CollectionRow {
    created_at: string | null
    updated_at: string | null
}
const COLLECTION_HEADERS = 'set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at'

interface MoxfieldRow extends CollectionRow {
    name: string
}
const MOXFIELD_HEADERS = 'Name,Count,Edition,Collector Number,Foil'

interface ManaboxRow extends CollectionRow {
    name: string
    scryfall_id: string
    added_at: string | null
}
const MANABOX_HEADERS = 'Name,Set code,Collector number,Foil,Quantity,Scryfall ID,Added'

const COLLECTION_EXPORT_QUERY = 'export_blisterpod.sql'
const COLLECTION_EXPORT_MOXFIELD_QUERY = 'export_moxfield.sql'
const COLLECTION_EXPORT_MANABOX_QUERY = 'export_manabox.sql'

const logger = createLogger('db:export')

export function registerExportHandlers(db: Database.Database): void {
    // Export collection to CSV
    ipcMain.handle(COLLECTION_EXPORT_NAME, (_, filePath: string) => {
        let rows: BlisterpodRow[] = []
        try {
            const sql = readQueryFile(COLLECTION_EXPORT_QUERY)
            logger.info(COLLECTION_EXPORT_NAME, sql)
            rows = db.prepare(sql).all() as BlisterpodRow[]
        } catch (err) {
            const errorMessage = `Error exporting collection: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        const lines = rows.map(r =>
            [r.set_code, r.collector_number, r.quantity_nonfoil, r.quantity_foil, r.created_at ?? '', r.updated_at ?? ''].join(',')
        )

        try {
            writeFileSync(filePath, [COLLECTION_HEADERS, ...lines].join('\n'), 'utf8')

        } catch (err) {
            const errorMessage = `Error exporting collection: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        logger.info(`${rows.length} rows exported to ${filePath}`)
        return { exported: rows.length }
    })

    // Export collection to Moxfield CSV format
    ipcMain.handle(COLLECTION_EXPORT_MOXFIELD_NAME, (_, filePath: string) => {
        let rows: MoxfieldRow[] = []
        try {
            const sql = readQueryFile(COLLECTION_EXPORT_MOXFIELD_QUERY)
            logger.info(COLLECTION_EXPORT_MOXFIELD_NAME, sql)
            rows = db.prepare(sql).all() as MoxfieldRow[]
        } catch (err) {
            const errorMessage = `Error exporting collection to Moxfield: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        const lines: string[] = []
        for (const r of rows) {
            if (r.quantity_nonfoil > 0) {
                lines.push(`${csvQuote(r.name)},${r.quantity_nonfoil},${r.set_code},${r.collector_number},false`)
            }
            if (r.quantity_foil > 0) {
                lines.push(`${csvQuote(r.name)},${r.quantity_foil},${r.set_code},${r.collector_number},true`)
            }
        }

        try {
            writeFileSync(filePath, [MOXFIELD_HEADERS, ...lines].join('\n'), 'utf8')

        } catch (err) {
            const errorMessage = `Error exporting collection to Moxfield: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        logger.info(`${lines.length} rows exported to ${filePath}`)
        return { exported: lines.length }
    })

    // Export collection to Manabox CSV format
    ipcMain.handle(COLLECTION_EXPORT_MANABOX_NAME, (_, filePath: string) => {
        let rows: ManaboxRow[] = []
        try {
            const sql = readQueryFile(COLLECTION_EXPORT_MANABOX_QUERY)
            logger.info(COLLECTION_EXPORT_MANABOX_NAME, sql)
            rows = db.prepare(sql).all() as ManaboxRow[]
        } catch (err) {
            const errorMessage = `Error exporting collection to Manabox: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        const lines: string[] = []
        for (const r of rows) {
            if (r.quantity_nonfoil > 0) {
                lines.push(`${csvQuote(r.name)},${r.set_code},${r.collector_number},normal,${r.quantity_nonfoil},${r.scryfall_id},${r.added_at ?? ''}`)
            }
            if (r.quantity_foil > 0) {
                lines.push(`${csvQuote(r.name)},${r.set_code},${r.collector_number},foil,${r.quantity_foil},${r.scryfall_id},${r.added_at ?? ''}`)
            }
        }

        try {
            writeFileSync(filePath, [MANABOX_HEADERS, ...lines].join('\n'), 'utf8')

        } catch (err) {
            const errorMessage = `Error exporting collection to Manabox: ${err}`
            logger.error(errorMessage)
            return { exported: 0, error: errorMessage }
        }

        logger.info(`${lines.length} rows exported to ${filePath}`)
        return { exported: lines.length }
    })
}
