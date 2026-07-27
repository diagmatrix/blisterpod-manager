import { join } from 'path'
import { app } from 'electron'
import type { AppSettings } from '../models/app'
import { readdirSync, statSync } from 'fs'
import Database from 'better-sqlite3'

export const USER_AGENT = `blisterpod-manager/${app.getVersion()}`

// Set by electron-vite when running `npm run dev`; unset for both packaged builds and `npm run preview`.
export const IS_DEV = process.env.NODE_ENV === 'development'

export function getIconPath(theme: AppSettings['theme']): string {
	const name = theme === 'dark' ? 'icon_w' : 'icon_b'
	return join(__dirname, `../../resources/${name}.png`)
}

// Electron's asar layer does not patch fs.promises.opendir, so it throws for paths inside app.asar
export async function* walkDir(dirPath: string, onlyFiles: boolean = true): AsyncGenerator<string> {
	for (const name of readdirSync(dirPath)) {
		const fullPath = join(dirPath, name)
		const stats = statSync(fullPath)
		if (stats.isDirectory() && !onlyFiles) {
			yield* walkDir(fullPath, onlyFiles)
		} else if (stats.isFile()) {
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

export function csvQuote(value: string): string {
	return `"${value.replace(/"/g, '""')}"`
}
