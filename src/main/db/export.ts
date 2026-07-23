import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import { readQueryFile } from ".";
import { writeFileSync } from "fs";

interface CollectionRow {
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
    created_at: string | null
    updated_at: string | null
}

interface MoxfieldRow {
    name: string
    set_code: string
    collector_number: string
    quantity_nonfoil: number
    quantity_foil: number
}

export const COLLECTION_EXPORT_NAME = 'collection:export'
export const COLLECTION_EXPORT_MOXFIELD_NAME = 'collection:export-moxfield'

const COLLECTION_EXPORT_QUERY = 'export_blisterpod.sql'
const COLLECTION_EXPORT_MOXFIELD_QUERY = 'export_moxfield.sql'

const logger = createLogger('db:export')

export function registerExportHandlers(db: Database.Database): void {
    // Export collection to CSV
    ipcMain.handle(COLLECTION_EXPORT_NAME, (_, filePath: string) => {
        let rows: CollectionRow[] = []
        try {
            const sql = readQueryFile(COLLECTION_EXPORT_QUERY)
            logger.info(COLLECTION_EXPORT_NAME, sql)
            rows = db.prepare(sql).all() as CollectionRow[]
        } catch (err) {
            logger.error(`Error exporting collection: ${err}`)
            return { exported: 0 }
        }

        const header = 'set_code,collector_number,quantity_nonfoil,quantity_foil,created_at,updated_at'
        const lines = rows.map(r =>
        [r.set_code, r.collector_number, r.quantity_nonfoil, r.quantity_foil, r.created_at ?? '', r.updated_at ?? ''].join(',')
        )

        writeFileSync(filePath, [header, ...lines].join('\n'), 'utf8')
        logger.info('Collection exported', { filePath, rows: rows.length })
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
            logger.error(`Error exporting collection to Moxfield: ${err}`)
            return { exported: 0 }
        }

        const header = 'Name,Count,Edition,Collector Number,Foil'
        const lines: string[] = []
        for (const r of rows) {
            if (r.quantity_nonfoil > 0) {
                lines.push(`"${r.name}",${r.quantity_nonfoil},${r.set_code},${r.collector_number},false`)
            }
            if (r.quantity_foil > 0) {
                lines.push(`"${r.name}",${r.quantity_foil},${r.set_code},${r.collector_number},true`)
            }
        }

        writeFileSync(filePath, [header, ...lines].join('\n'), 'utf8')
        logger.info('Collection exported to Moxfield', { filePath, rows: rows.length })
        return { exported: lines.length }
    })
}
