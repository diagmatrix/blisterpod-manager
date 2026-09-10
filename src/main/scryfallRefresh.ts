import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'
import { createLogger } from './logger'
import { serializeVal, USER_AGENT } from './utils'

const log = createLogger('scryfall-refresh')

const SCRYFALL_BASE = 'https://api.scryfall.com'
const WAIT_MS = 100
const TYPE_LINE_SEPARATOR = ' — '
const FACE_SEPARATOR = ' // '

interface ScryfallPage {
    data: Record<string, unknown>[]
    has_more: boolean
    next_page?: string
}

let lastRequestAt = 0

async function scryfallGet(url: string): Promise<unknown> {
    const fullUrl = url.startsWith('http') ? url : `${SCRYFALL_BASE}${url}`

    const wait = WAIT_MS - (Date.now() - lastRequestAt)
    if (wait > 0) {
        await new Promise<void>((r) => setTimeout(r, wait))
    }
    lastRequestAt = Date.now()

    const res = await fetch(fullUrl, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
        throw new Error(`[${res.status}] ${body.code ?? 'http_error'}: ${body.details ?? `HTTP ${res.status}`}`)
    }

    return res.json()
}

async function* readJsonLines(stream: NodeJS.ReadableStream): AsyncGenerator<Record<string, unknown>> {
    stream.setEncoding('utf8')

    let buffer = ''
    for await (const chunk of stream) {
        buffer += chunk as string

        let newlineAt: number
        while ((newlineAt = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newlineAt).trim()
            buffer = buffer.slice(newlineAt + 1)
            if (line) {
                yield JSON.parse(line) as Record<string, unknown>
            }
        }
    }

    const lastLine = buffer.trim()
    if (lastLine) {
        yield JSON.parse(lastLine) as Record<string, unknown>
    }
}

async function* fetchPages(startUrl: string): AsyncGenerator<Record<string, unknown>> {
    let url: string | undefined = startUrl

    while (url) {
        const page = (await scryfallGet(url)) as ScryfallPage
        for (const item of page.data ?? []) {
            yield item
        }
        url = page.has_more ? page.next_page : undefined
    }
}

export function fetchAllSets(): AsyncGenerator<Record<string, unknown>> {
    return fetchPages('/sets')
}

export function fetchSearchPages(searchURI: string): AsyncGenerator<Record<string, unknown>> {
    return fetchPages(searchURI)
}

export async function fetchSet(setCode: string): Promise<Record<string, unknown>> {
    return (await scryfallGet(`/sets/${setCode.toLowerCase()}`)) as Record<string, unknown>
}

export async function fetchCard(setCode: string, collectorNumber: string): Promise<Record<string, unknown>> {
    return (await scryfallGet(`/cards/${setCode.toLowerCase()}/${collectorNumber}`)) as Record<string, unknown>
}

export async function* streamBulkCards(): AsyncGenerator<Record<string, unknown>> {
    const meta = (await scryfallGet('/bulk-data/default_cards')) as { jsonl_download_uri?: string }
    const downloadUri = meta.jsonl_download_uri
    if (!downloadUri) {
        throw new Error('jsonl_download_uri not found in bulk-data response')
    }

    log.info('Downloading bulk card data', { uri: downloadUri })
    const response = await fetch(downloadUri, {
        headers: { 'User-Agent': USER_AGENT },
    })
    if (!response.ok) {
        throw new Error(`Failed to download bulk data: ${response.status}`)
    }
    if (!response.body) {
        throw new Error('Response body is null')
    }

    const byteStream = Readable.fromWeb(response.body as any)
    yield* readJsonLines(byteStream.pipe(createGunzip()))
}

export function buildSetRow(setJson: Record<string, unknown>, columns: string[]): Record<string, unknown> {
    const row: Record<string, unknown> = {}

    if (setJson.id) {
        for (const col of columns) {
            let val = setJson[col]
            if (col === 'code' && val != null) {
                val = String(val).toUpperCase()
            }
            if (col === 'parent_set_code' && val != null) {
                val = String(val).toUpperCase()
            }

            row[col] = serializeVal(val ?? null)
        }
    }

    return row
}

export function parseCardTypes(cardTypesToParse: string, isSubtypes: boolean = false): string[] | null {
    const parseFace = (face: string): string[] | null => {
        const faceParts = face.split(TYPE_LINE_SEPARATOR)

        const idxToParse = !isSubtypes ? 0 : faceParts.length > 1 ? 1 : -1
        if (idxToParse < 0) {
            return null
        }

        return faceParts[idxToParse]
            .split(' ')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
    }

    const cardTypeFaces = cardTypesToParse.split('//')
    const cardTypes: string[] = []
    for (const face of cardTypeFaces) {
        const parsedFace = parseFace(face.trim())
        if (parsedFace) {
            cardTypes.push(...parsedFace)
        }
    }

    if (cardTypes.length === 0) {
        return null
    }

    return [...new Set<string>(cardTypes)]
}

export function getTypeLine(cardJson: Record<string, unknown>): string {
    if (typeof cardJson.type_line === 'string' && cardJson.type_line.length > 0) {
        return cardJson.type_line
    }

    const faces = Array.isArray(cardJson.card_faces) ? cardJson.card_faces : []
    return faces
        .map((face) => (face as Record<string, unknown> | null)?.type_line)
        .filter((typeLine): typeLine is string => typeof typeLine === 'string' && typeLine.length > 0)
        .join(FACE_SEPARATOR)
}

export function buildCardRow(cardJson: Record<string, unknown>, columns: string[]): Record<string, unknown> {
    const row: Record<string, unknown> = {}
    for (const col of columns) {
        let val: unknown
        if (col === 'set_code') {
            val = typeof cardJson.set === 'string' ? cardJson.set.toUpperCase() : null
        } else if (col === 'collector_number_normalised') {
            const digits = typeof cardJson.collector_number === 'string'
                ? cardJson.collector_number.replace(/\D/g, '')
                : ''
            val = digits ? parseInt(digits, 10) : null
        } else if (col === 'type_line') {
            val = getTypeLine(cardJson) || null
        } else if (col === 'card_types' || col === 'card_subtypes') {
            const rawCardTypes = getTypeLine(cardJson)
            val = rawCardTypes ? parseCardTypes(rawCardTypes, col === 'card_subtypes') : null
        } else {
            val = cardJson[col]
        }
        row[col] = serializeVal(val ?? null)
    }
    return row
}
