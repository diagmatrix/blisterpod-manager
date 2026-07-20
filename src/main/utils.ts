import { join } from 'path'
import { app } from 'electron'
import type { AppSettings } from '../shared/app'
import { opendir } from 'fs/promises'
import Database from 'better-sqlite3'

export const USER_AGENT = `blisterpod-manager/${app.getVersion()}`

export function getIconPath(theme: AppSettings['theme']): string {
	const name = theme === 'dark' ? 'icon_w' : 'icon_b'
	return join(__dirname, `../../resources/${name}.png`)
}

export async function* walkDir(dirPath: string, onlyFiles: boolean = true): AsyncGenerator<string> {
	const dir = await opendir(dirPath)

	for await (const entry of dir) {
		const fullPath = join(dirPath, entry.name)
		if (entry.isDirectory() && !onlyFiles) {
			yield* walkDir(fullPath, onlyFiles)
		} else if (entry.isFile()) {
			yield fullPath
		}
	}
}

export function filterArrayContents(arr: string[], validContents: string[]) {
	return arr.filter((v) => validContents.includes(v))
}

export function serializeVal(val: unknown): unknown {
 	if (val === null || val === undefined) {
		return null
	}
	
	if (typeof val === 'boolean') {
		return val ? 1 : 0
	}
	
	if (typeof val === 'object') {
		return JSON.stringify(val)
	}

	return val
}

export function getTableColumns(db: Database.Database, tableName: string): string[] {
	const dbCols = db.pragma(`table_info(${tableName})`) as { name: string }[]
	return dbCols.map((row) => row.name)
}

export function isEmpty(record: Record<string, unknown>): boolean {
	return Object.keys(record).length === 0
}
