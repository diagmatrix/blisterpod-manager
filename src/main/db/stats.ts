import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { ipcMain } from "electron";
import { readQueryFile } from ".";
import { CollectionCard } from "../../models/cards";
import { StatsColors, StatsRarityEntry, StatsSetEntry, StatsSummary } from "../../models/stats";
import {
    STATS_SUMMARY_NAME,
    STATS_COLOR_DISTRIBUTION_NAME,
    STATS_RARITY_BREAKDOWN_NAME,
    STATS_TOP_VALUE_NAME,
    STATS_BY_SET_NAME,
} from "../../models/channels";

const STATS_SUMMARY_QUERY = 'stats_summary.sql'
const STATS_COLOR_DISTRIBUTION_QUERY = 'stats_colors.sql'
const STATS_RARITY_BREAKDOWN_QUERY = 'stats_rarity.sql'
const STATS_TOP_VALUE_QUERY = 'stats_top_value.sql'
const STATS_BY_SET_QUERY = 'stats_by_set.sql'

const MAX_STATS_TOP_VALUE_LIMIT = 50
const MAX_STATS_BY_SET_LIMIT = 50

const logger = createLogger('db:stats')

export function registerStatsHandlers(db: Database.Database): void {
    // Stats summary
    ipcMain.handle(STATS_SUMMARY_NAME, () => {
        let row: StatsSummary = {
            uniquePrintings: 0,
            uniqueNames: 0,
            totalCards: 0,
            estimatedValue: 0
        }
        try {
            const sql = readQueryFile(STATS_SUMMARY_QUERY)
            logger.info(STATS_SUMMARY_NAME, sql)
            row = db.prepare(sql).get() as StatsSummary ?? row
        } catch (err) {
            logger.error(`Error fetching stats summary: ${err}`)
        }
        return row
    })

    // Color distribution stats
    ipcMain.handle(STATS_COLOR_DISTRIBUTION_NAME, () => {
        let row: StatsColors = {
            white: 0,
            blue: 0,
            black: 0,
            red: 0,
            green: 0,
            colorless: 0,
            multicolored: 0
        }
        try {
            const sql = readQueryFile(STATS_COLOR_DISTRIBUTION_QUERY)
            logger.info(STATS_COLOR_DISTRIBUTION_NAME, sql)
            row = db.prepare(sql).get() as StatsColors
        } catch (err) {
            logger.error(`Error fetching stats color distribution: ${err}`)
        }
        return row
    })

    // Rarity breakdown stats
    ipcMain.handle(STATS_RARITY_BREAKDOWN_NAME, () => {
        let rows: StatsRarityEntry[] = []
        try {
            const sql = readQueryFile(STATS_RARITY_BREAKDOWN_QUERY)
            logger.info(STATS_RARITY_BREAKDOWN_NAME, sql)
            rows = db.prepare(sql).all() as StatsRarityEntry[]
        } catch (err) {
            logger.error(`Error fetching stats rarity breakdown: ${err}`)
        }
        return rows
    })

    // Top value cards
    ipcMain.handle(STATS_TOP_VALUE_NAME, (_, params: { limit?: number } = {}) => {
        const limit = Math.min(params?.limit ?? 10, MAX_STATS_TOP_VALUE_LIMIT)
        let rows: CollectionCard[] = []
        try {
            const sql = readQueryFile(STATS_TOP_VALUE_QUERY)
            logger.info(STATS_TOP_VALUE_NAME, sql)
            rows = db.prepare(sql).all(limit) as CollectionCard[]
        } catch (err) {
            logger.error(`Error fetching stats top value: ${err}`)
        }
        return rows
    })

    // Stats by set
    ipcMain.handle(STATS_BY_SET_NAME, (_, params: { limit?: number } = {}) => {
        const limit = Math.min(params?.limit ?? 10, MAX_STATS_BY_SET_LIMIT)
        let rows: StatsSetEntry[] = []
        try {
            const sql = readQueryFile(STATS_BY_SET_QUERY)
            logger.info(STATS_BY_SET_NAME, sql)
            rows = db.prepare(sql).all(limit) as StatsSetEntry[]
        } catch (err) {
            logger.error(`Error fetching stats by set: ${err}`)
        }
        return rows
    })
}