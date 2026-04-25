import { app, protocol, net } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync, renameSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { createLogger } from './logger'

const log = createLogger('mana-symbols')

const ASSETS_DIR = join(app.getPath('userData'), 'mana-symbols')
const SYMBOLOGY_API = 'https://api.scryfall.com/symbology'

function notFound(url?: URL): Response {
  log.warn('Mana symbol not found', { url: url?.toString() })
  return new Response(null, { status: 404 })
}

export function initManaSymbolProtocol(): void {
  mkdirSync(ASSETS_DIR, { recursive: true })

  protocol.handle('mana-symbol', (request) => {
    const url = URL.canParse(request.url) ? new URL(request.url) : null
    if (!url) return notFound()

    const filename = url.pathname.replace(/^\/+/, '')
    if (!filename) return notFound()

    const userPath = join(ASSETS_DIR, filename)
    if (existsSync(userPath)) {
      log.debug('Serving mana symbol from cache', { filename })
      return net.fetch(pathToFileURL(userPath).toString())
    }

    return notFound(url)
  })
}

export async function downloadManaSymbols(): Promise<void> {
  const res = await fetch(SYMBOLOGY_API)
  if (!res.ok) throw new Error(`Failed to fetch symbology: ${res.status}`)

  const { data } = (await res.json()) as { data: { symbol: string; svg_uri: string }[] }

  mkdirSync(ASSETS_DIR, { recursive: true })

  for (const entry of data) {
    if (!entry.svg_uri) continue

    const filename = entry.svg_uri.split('/').pop()
    if (!filename) continue

    const destPath = join(ASSETS_DIR, filename)

    log.debug('Downloading mana symbol', { symbol: entry.symbol })
    const svgRes = await fetch(entry.svg_uri)
    if (!svgRes.ok) {
      log.warn('Failed to download mana symbol', { symbol: entry.symbol, status: svgRes.status })
      continue
    }

    const bytes = new Uint8Array(await svgRes.arrayBuffer())
    const tmpPath = `${destPath}.tmp`
    writeFileSync(tmpPath, bytes)
    renameSync(tmpPath, destPath)
  }

  log.info('Mana symbols downloaded', { count: data.length })
}
