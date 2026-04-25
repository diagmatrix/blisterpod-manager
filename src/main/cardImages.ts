import { app, protocol, net } from 'electron'
import { createLogger } from './logger'

const log = createLogger('card-images')
import { join } from 'path'
import { mkdirSync, existsSync, renameSync, writeFileSync } from 'fs'
import { pathToFileURL } from 'url'

const CACHE_DIR = join(app.getPath('userData'), 'card-images')

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

function notFound(url?: URL): Response {
  log.warn('Card image not found', { url: url?.toString() })
  return new Response(null, { status: 404 })
}

function isValidScryfallId(id: string): boolean {
  return /^[a-f0-9-]{36}$/i.test(id)
}

// Cache as <id>_back.jpg if 'back' appears in the URL path, otherwise <id>_front.jpg.
function faceFromUrl(sourceUrl: string): string {
  try {
    if (new URL(sourceUrl).pathname.split('/').includes('back')) return '_back'
  } catch { /* ignore */ }
  return '_front'
}

function isAllowedSource(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.scryfall.io')
  } catch {
    return false
  }
}

async function downloadAndCache(sourceUrl: string, cachePath: string): Promise<Response> {
  const upstream = await fetch(sourceUrl)
  if (!upstream.ok) {
    return new Response(null, { status: upstream.status })
  }

  const bytes = new Uint8Array(await upstream.arrayBuffer())
  const tmpPath = `${cachePath}.tmp`
  writeFileSync(tmpPath, bytes)
  renameSync(tmpPath, cachePath)

  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg' },
  })
}

export function initCardImageProtocol(): void {
  ensureCacheDir()

  protocol.handle('card-image', async (request) => {
    const url = URL.canParse(request.url) ? new URL(request.url) : null
    if (!url) return notFound()

    // card-image://<scryfall_id>?u=<encoded scryfall image url>
    const scryfallId = (url.hostname || url.pathname.replace(/^\/+/, '')).toLowerCase()
    if (!isValidScryfallId(scryfallId)) return notFound(url)

    const sourceUrl = url.searchParams.get('u')
    if (!sourceUrl || !isAllowedSource(sourceUrl)) return notFound(url)

    const cachePath = join(CACHE_DIR, `${scryfallId}${faceFromUrl(sourceUrl)}.jpg`)

    if (existsSync(cachePath)) {
      log.debug('Serving card image from cache', { scryfallId, face: faceFromUrl(sourceUrl) })
      return net.fetch(pathToFileURL(cachePath).toString())
    }

    try {
      log.debug('Fetching card image', { scryfallId, face: faceFromUrl(sourceUrl) })
      return await downloadAndCache(sourceUrl, cachePath)
    } catch (err) {
      log.error('Card image fetch failed', { scryfallId, err })
      return notFound(url)
    }
  })
}
