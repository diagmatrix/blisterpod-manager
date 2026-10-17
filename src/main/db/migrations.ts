import { basename } from "path";
import { existsSync, readFileSync } from "fs";
import Database from "better-sqlite3";
import { createLogger } from "../logger";
import { walkDir } from "../utils";
import { MIGRATIONS_DIR } from "./paths";

const logger = createLogger('migrations')

interface Migration {
    version: number
    path: string
}

/** Migration files are `NNN_description.sql`; `NNN` is the version they bring the database to. */
async function listMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = []

    if (!existsSync(MIGRATIONS_DIR)) {
        logger.warn(`No migrations directory at ${MIGRATIONS_DIR}`)
        return migrations
    }

    for await (const filePath of walkDir(MIGRATIONS_DIR)) {
        if (!filePath.endsWith('.sql')) {
            continue
        }

        const version = Number(basename(filePath).split('_')[0])
        if (!Number.isInteger(version)) {
            logger.warn(`Ignoring migration file with no version prefix: ${filePath}`)
            continue
        }

        migrations.push({ version, path: filePath })
    }

    return migrations.sort((a, b) => a.version - b.version)
}

function getCurrentVersion(db: Database.Database): number {
    return db.pragma('user_version', { simple: true }) as number
}

export async function runMigrations(db: Database.Database): Promise<number[]> {
    const currentVersion = getCurrentVersion(db)
    const pending = (await listMigrations()).filter((migration) => migration.version > currentVersion)

    if (pending.length === 0) {
        logger.info(`Database is up to date at schema version ${currentVersion}`)
        return []
    }

    const applied: number[] = []
    for (const migration of pending) {
        logger.info(`Applying migration ${migration.version}: ${basename(migration.path)}`)
        const sql = readFileSync(migration.path, 'utf-8')

        try {
            db.transaction(() => {
                db.exec(sql)
                db.pragma(`user_version = ${migration.version}`)
            })()
        } catch (error) {
            logger.error(`Migration ${migration.version} failed, database left at version ${getCurrentVersion(db)}: ${error}`)
            throw error
        }

        applied.push(migration.version)
    }

    logger.info(`Database migrated to schema version ${getCurrentVersion(db)}`)
    return applied
}
