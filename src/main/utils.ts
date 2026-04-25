import { join } from 'path'
import type { AppSettings } from '../shared/types'

export function getIconPath(theme: AppSettings['theme']): string {
  const name = theme === 'dark' ? 'icon_w' : 'icon_b'
  return join(__dirname, `../../resources/${name}.png`)
}
