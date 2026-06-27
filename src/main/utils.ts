import { join } from 'path'
import { app } from 'electron'
import type { AppSettings } from '../shared/app'

export const USER_AGENT = `blisterpod-manager/${app.getVersion()}`

export function getIconPath(theme: AppSettings['theme']): string {
  const name = theme === 'dark' ? 'icon_w' : 'icon_b'
  return join(__dirname, `../../resources/${name}.png`)
}
