import { app, protocol, net } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, renameSync } from 'fs'
import { pathToFileURL } from 'url'
import { createLogger } from './logger'

const log = createLogger('ccmg-font')

const FONTS_DIR = join(app.getPath('userData'), 'fonts')
const FONT_FILE = join(FONTS_DIR, 'CCMG.otf')
const FONT_URL = 'https://github.com/diagmatrix/CCMG/raw/refs/heads/master/CCMG.otf'

export function initFontProtocol(): void {
  protocol.handle('app-font', (request) => {
    const url = URL.canParse(request.url) ? new URL(request.url) : null
    if (!url) return new Response(null, { status: 404 })
    const relativePath = url.pathname.replace(/^\/+/, '')
    if (!relativePath) return new Response(null, { status: 404 })
    const localPath = join(FONTS_DIR, relativePath)
    if (!existsSync(localPath)) return new Response(null, { status: 404 })
    return net.fetch(pathToFileURL(localPath).toString())
  })
}

export async function downloadCCMGFont(): Promise<void> {
  mkdirSync(FONTS_DIR, { recursive: true })
  log.info('Downloading CCMG font', { url: FONT_URL })
  const res = await fetch(FONT_URL, { headers: { 'User-Agent': 'blisterpod-manager/0.1' } })
  if (!res.ok) throw new Error(`Failed to download CCMG font: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const tmpPath = `${FONT_FILE}.tmp`
  writeFileSync(tmpPath, bytes)
  renameSync(tmpPath, FONT_FILE)
  log.info('CCMG font downloaded')
}

export function getCCMGFontStatus(): { downloaded: boolean } {
  return { downloaded: existsSync(FONT_FILE) }
}
