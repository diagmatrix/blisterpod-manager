import { join } from 'path'
import { app } from 'electron'
import type { AppSettings } from '../shared/app'
import { opendir } from 'fs/promises'

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
