import { app, protocol, net } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync, renameSync, writeFileSync, readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { createLogger } from './logger'

const log = createLogger('keyrune-assets')

const ASSETS_DIR = join(app.getPath('userData'), 'keyrune')

const CDN_FILES = [
  'css/keyrune.min.css',
  'fonts/keyrune.eot',
  'fonts/keyrune.svg',
  'fonts/keyrune.ttf',
  'fonts/keyrune.woff',
  'fonts/keyrune.woff2',
]

const VERSION_API = 'https://data.jsdelivr.com/v1/packages/npm/keyrune/resolved?specifier=latest'

function notFound(): Response {
  return new Response(null, { status: 404 })
}

export function initKeyruneProtocol(): void {
  protocol.handle('keyrune', (request) => {
    const url = URL.canParse(request.url) ? new URL(request.url) : null
    if (!url) return notFound()

    // Use pathname only — hostname is a dummy segment used to anchor relative URL
    // resolution (keyrune://app/css/keyrune.min.css → pathname = /css/keyrune.min.css)
    const relativePath = url.pathname.replace(/^\/+/, '')
    if (!relativePath) return notFound()

    const localPath = join(ASSETS_DIR, relativePath)
    if (!existsSync(localPath)) return notFound()

    return net.fetch(pathToFileURL(localPath).toString())
  })
}

export async function downloadKeyruneAssets(): Promise<string> {
  const versionRes = await fetch(VERSION_API)
  if (!versionRes.ok) throw new Error(`Failed to resolve keyrune version: ${versionRes.status}`)

  const { version } = (await versionRes.json()) as { version: string }
  const cdnBase = `https://cdn.jsdelivr.net/npm/keyrune@${version}`

  for (const file of CDN_FILES) {
    const destPath = join(ASSETS_DIR, file)
    mkdirSync(join(destPath, '..'), { recursive: true })

    log.debug('Downloading keyrune asset', { file, version })
    const res = await fetch(`${cdnBase}/${file}`)
    if (!res.ok) throw new Error(`Failed to download keyrune/${file}: ${res.status}`)

    const bytes = new Uint8Array(await res.arrayBuffer())
    const tmpPath = `${destPath}.tmp`
    writeFileSync(tmpPath, bytes)
    renameSync(tmpPath, destPath)
  }

  const versionPath = join(ASSETS_DIR, 'version.json')
  writeFileSync(versionPath, JSON.stringify({ version }))
  log.info('Keyrune assets downloaded', { version })

  return version
}

export function getKeyruneVersion(): string | null {
  const versionPath = join(ASSETS_DIR, 'version.json')
  if (!existsSync(versionPath)) return null
  try {
    const { version } = JSON.parse(readFileSync(versionPath, 'utf-8')) as { version: string }
    return version
  } catch {
    return null
  }
}
