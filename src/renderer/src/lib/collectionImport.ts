import { FileParsingResult } from '../../../models/responses'
import type { CollectionAddParams } from '../../../models/search'
import { ProviderID } from '../../../models/transfers'
import { createLogger } from './logger'

interface CSVContents {
    rows: string[][]
    headerIndex: (column: string) => number
    error?: string
}

type CSVParsedRow = CollectionAddParams | { skipped: 'setCode' | 'collectorNumber' | 'invalidQuantities' }

interface CSVSkippedRows {
    setCode: number
    collectorNumber: number
    invalidQuantities: number
}

interface CSVParsingResult {
    cards: CollectionAddParams[]
    skipped: CSVSkippedRows
}

const logger = createLogger('file:parsing')

function parseCSVRow(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            // A doubled quote inside a quoted field is one literal quote
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

function parseDate(raw: string): string | undefined {
    const s = raw?.trim()
    if (!s) {
        return undefined
    }

    const parts = s.split('/')
    if (parts.length !== 3) {
        return undefined
    }

    const [day, month, year] = parts
    const d = new Date(Number(year), Number(month) - 1, Number(day))

    return isNaN(d.getTime()) ? undefined : d.toISOString()
}

function readCSV(text: string, searchColumns?: (columns: string[]) => boolean): CSVContents {
    const defaultHeaderIndex = () => -1

    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
    if (lines.length < 2) {
        const errorMessage = 'File contains no rows'
        logger.warn(errorMessage)
        return { headerIndex: defaultHeaderIndex, rows: [], error: errorMessage }
    }

    let headers: string[] = []
    let rowsStart = 1
    if (searchColumns) {
        const headerIdx = lines.findIndex(l => {
            const cols = parseCSVRow(l).map(h => h.trim().toUpperCase())
            return searchColumns(cols)
        })
        if (headerIdx === -1) {
            const errorMessage = 'Could not find column headers'
            logger.warn(errorMessage)
            return { headerIndex: defaultHeaderIndex, rows: [], error: errorMessage }
        }

        rowsStart = headerIdx + 1
        headers = parseCSVRow(lines[headerIdx]).map(h => h.trim().toUpperCase())
    } else {
        headers = parseCSVRow(lines[0])
    }

    return {
        headerIndex: (name: string) => headers.indexOf(name),
        rows: lines.slice(rowsStart).map((line) => parseCSVRow(line))
    }
}

function parseCSVRows(rows: string[][], rowParser: (cols: string[]) => CSVParsedRow): CSVParsingResult {
    const cards = new Map<string, CollectionAddParams>()
    const skipped: CSVSkippedRows = { setCode: 0, collectorNumber: 0, invalidQuantities: 0 }

    for (const row of rows) {
        const parsedRow = rowParser(row)
        if ('skipped' in parsedRow) {
            skipped[parsedRow.skipped]++
            continue
        }

        const key = `${parsedRow.setCode}:${parsedRow.collectorNumber}`
        const existing = cards.get(key)
        if (existing) {
            existing.quantityNonfoil += parsedRow.quantityNonfoil
            existing.quantityFoil += parsedRow.quantityFoil
        } else {
            cards.set(key, parsedRow)
        }
    }

    return { cards: Array.from(cards.values()), skipped }
}

function createParsingErrorMessage(skipped: CSVSkippedRows): string | undefined {
    let error: string | undefined
    if (skipped.setCode > 0) {
        error = `${skipped.setCode} rows were not imported due to missing the set code`
    }
    if (skipped.collectorNumber > 0) {
        const errorMessage = `${skipped.collectorNumber} rows were not imported due to missing the collector number`
        error = error ? `${error}. ${errorMessage}` : errorMessage
    }
    if (skipped.invalidQuantities > 0) {
        const errorMessage = `${skipped.invalidQuantities} rows were not imported due to invalid quantity values`
        error = error ? `${error}. ${errorMessage}` : errorMessage
    }

    if (error) {
        logger.warn(error)
    }

    return error
}

function parseBlisterpodCSV(text: string): FileParsingResult {
    const { headerIndex, rows, error } = readCSV(text)
    if (error) {
        return { cards: [], error: error }
    }

    const setIdx = headerIndex('set_code')
    const numberIdx = headerIndex('collector_number')
    const nonfoilIdx = headerIndex('quantity_nonfoil')
    const foilIdx = headerIndex('quantity_foil')
    const createdIdx = headerIndex('created_at')
    const updatedIdx = headerIndex('updated_at')

    if (setIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing set_code and/or collector_number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const { cards, skipped } = parseCSVRows(rows, (row: string[]): CSVParsedRow => {
        const setCode = row[setIdx]?.trim().toUpperCase()
        if (!setCode) {
            return { skipped: 'setCode' }
        }

        const collectorNumber = row[numberIdx]?.trim()
        if (!collectorNumber) {
            return { skipped: 'collectorNumber' }
        }

        const quantityNonfoil = parseInt(row[nonfoilIdx] ?? '0', 10) || 0
        const quantityFoil = parseInt(row[foilIdx] ?? '0', 10) || 0
        if (quantityFoil < 0 || quantityNonfoil < 0 || quantityFoil + quantityNonfoil === 0) {
            return { skipped: 'invalidQuantities' }
        }

        return {
            setCode,
            collectorNumber,
            quantityNonfoil,
            quantityFoil,
            createdAt: row[createdIdx]?.trim() || undefined,
            updatedAt: row[updatedIdx]?.trim() || undefined,
        }
    })

    return { cards: cards, error: createParsingErrorMessage(skipped) }
}

function parseMoxfieldCSV(text: string): FileParsingResult {
    const { headerIndex, rows, error } = readCSV(text)
    if (error) {
        return { cards: [], error: error }
    }

    const countIdx = headerIndex('Count')
    const editionIdx = headerIndex('Edition')
    const numberIdx = headerIndex('Collector Number')
    const foilIdx = headerIndex('Foil')

    if (editionIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing Edition and/or Collector Number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const { cards, skipped } = parseCSVRows(rows, (row: string[]): CSVParsedRow => {
        const setCode = row[editionIdx]?.trim().toUpperCase()
        if (!setCode) {
            return { skipped: 'setCode' }
        }

        const collectorNumber = row[numberIdx]?.trim()
        if (!collectorNumber) {
            return { skipped: 'collectorNumber' }
        }

        const count = parseInt(row[countIdx] ?? '0', 10) || 0
        if (count <= 0) {
            return { skipped: 'invalidQuantities' }
        }

        const isFoil = row[foilIdx]?.trim().toLowerCase() === 'true'

        return {
            setCode,
            collectorNumber,
            quantityNonfoil: isFoil ? 0 : count,
            quantityFoil: isFoil ? count : 0,
        }
    })

    return { cards: cards, error: createParsingErrorMessage(skipped) }
}

function parseGoogleDriveCSV(text: string): FileParsingResult {
    const { headerIndex, rows, error } = readCSV(text, (cols: string[]) => {
        return (cols.includes('NAME') || cols.includes('TYPE')) && cols.includes('SET') && cols.includes('NUMBER')
    })
    if (error) {
        return { cards: [], error: error }
    }

    const nameIdx = headerIndex('NAME') !== -1 ? headerIndex('NAME') : headerIndex('TYPE')
    const setIdx = headerIndex('SET')
    const numberIdx = headerIndex('NUMBER')
    const quantityIdx = headerIndex('QUANTITY')
    const addedIdx = headerIndex('ADDED')
    const modifiedIdx = headerIndex('LAST MODIFIED')

    const { cards, skipped } = parseCSVRows(rows, (cols: string[]): CSVParsedRow => {
        const setCode = cols[setIdx]?.trim()
        if (!setCode) {
            return { skipped: 'setCode' }
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            return { skipped: 'collectorNumber' }
        }

        const quantity = parseInt(cols[quantityIdx] ?? '0', 10) || 0
        if (quantity <= 0) {
            return { skipped: 'invalidQuantities' }
        }

        const isFoil = (cols[nameIdx] ?? '').includes('(F)')

        return {
            setCode,
            collectorNumber,
            quantityNonfoil: isFoil ? 0 : quantity,
            quantityFoil: isFoil ? quantity : 0,
            createdAt: parseDate(cols[addedIdx] ?? ''),
            updatedAt: parseDate(cols[modifiedIdx] ?? ''),
        }
    })

    return { cards: cards, error: createParsingErrorMessage(skipped) }
}

function parseManaboxCSV(text: string): FileParsingResult {
    const { headerIndex, rows, error } = readCSV(text)
    if (error) {
        return { cards: [], error: error }
    }

    const quantityIdx = headerIndex('Quantity')
    const setCodeIdx = headerIndex('Set code')
    const numberIdx = headerIndex('Collector number')
    const foilIdx = headerIndex('Foil')

    if (setCodeIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing Set code and/or Collector number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const { cards, skipped } = parseCSVRows(rows, (cols: string[]): CSVParsedRow => {
        const setCode = cols[setCodeIdx]?.trim().toUpperCase()
        if (!setCode) {
            return { skipped: 'setCode' }
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            return { skipped: 'collectorNumber' }
        }

        const count = parseInt(cols[quantityIdx] ?? '0', 10) || 0
        if (count <= 0) {
            return { skipped: 'invalidQuantities' }
        }

        const isFoil = cols[foilIdx] && !(cols[foilIdx].trim().toLowerCase() === 'normal')

        return {
            setCode,
            collectorNumber,
            quantityNonfoil: isFoil ? 0 : count,
            quantityFoil: isFoil ? count : 0,
        }
    })

    return { cards: cards, error: createParsingErrorMessage(skipped) }
}

export function parseCSVFile(text: string, provider: ProviderID): FileParsingResult {
    switch(provider) {
        case 'blisterpod':
            return parseBlisterpodCSV(text)
        case 'googleDrive':
            return parseGoogleDriveCSV(text)
        case 'moxfield':
            return parseMoxfieldCSV(text)
        case 'manabox':
            return parseManaboxCSV(text)
        default:
            return { cards: [], error: 'Invalid provider' }
    }
}
