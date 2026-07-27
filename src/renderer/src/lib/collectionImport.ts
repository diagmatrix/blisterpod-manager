import { FileParsingResult } from '../../../models/responses'
import type { CollectionAddParams } from '../../../models/search'
import { ProviderID } from '../../../models/transfers'
import { createLogger } from './logger'

const logger = createLogger('file:parsing')

function parseCSVRow(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes
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

function createParsingErrorMessage(rowsMissingSetCode: number, rowsMissingCollectorNumber: number, rowsWithInvalidQuantities: number): string | undefined {
    let error: string | undefined
    if (rowsMissingSetCode > 0) {
        error = `${rowsMissingSetCode} rows were not imported due to missing the set code`
    }
    if (rowsMissingCollectorNumber > 0) {
        const errorMessage = `${rowsMissingCollectorNumber} rows were not imported due to missing the collector number`
        error = error ? `${error}. ${errorMessage}` : errorMessage
    }
    if (rowsWithInvalidQuantities > 0) {
        const errorMessage = `${rowsWithInvalidQuantities} rows were not imported due to invalid quantity values`
        error = error ? `${error}. ${errorMessage}` : errorMessage
    }

    if (error) {
        logger.warn(error)
    }

    return error
}

function parseBlisterpodCSV(text: string): FileParsingResult {
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
    if (lines.length < 2) {
        const errorMessage = 'File contains no rows'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const headers = parseCSVRow(lines[0])
    const col = (name: string) => headers.indexOf(name)
    const setIdx = col('set_code')
    const numberIdx = col('collector_number')
    const nonfoilIdx = col('quantity_nonfoil')
    const foilIdx = col('quantity_foil')
    const createdIdx = col('created_at')
    const updatedIdx = col('updated_at')

    if (setIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing set_code and/or collector_number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const cards: CollectionAddParams[] = []
    let missingSetCode = 0
    let missingCollectorNumber = 0
    let invalidQuantities = 0
    for (const line of lines.slice(1)) {
        const cols = parseCSVRow(line)

        const setCode = cols[setIdx]?.trim()
        if (!setCode) {
            missingSetCode++
            continue
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            missingCollectorNumber++
            continue
        }

        const quantityNonfoil = parseInt(cols[nonfoilIdx] ?? '0', 10) || 0
        const quantityFoil = parseInt(cols[foilIdx] ?? '0', 10) || 0
        if (quantityFoil < 0 || quantityNonfoil < 0 || quantityFoil + quantityNonfoil === 0) {
            invalidQuantities++
            continue
        }

        cards.push({
            setCode,
            collectorNumber,
            quantityNonfoil,
            quantityFoil,
            createdAt: cols[createdIdx]?.trim() || undefined,
            updatedAt: cols[updatedIdx]?.trim() || undefined,
        })
    }

    return { cards: cards, error: createParsingErrorMessage(missingSetCode, missingCollectorNumber, invalidQuantities) }
}

function parseMoxfieldCSV(text: string): FileParsingResult {
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
    if (lines.length < 2) {
        const errorMessage = 'File contains no rows'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const headers = parseCSVRow(lines[0])
    const col = (name: string) => headers.indexOf(name)
    const countIdx = col('Count')
    const editionIdx = col('Edition')
    const numberIdx = col('Collector Number')
    const foilIdx = col('Foil')

    if (editionIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing Edition and/or Collector Number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const merged = new Map<string, CollectionAddParams>()
    let missingSetCode = 0
    let missingCollectorNumber = 0
    let invalidQuantities = 0
    for (const line of lines.slice(1)) {
        const cols = parseCSVRow(line)

        const setCode = cols[editionIdx]?.trim().toUpperCase()
        if (!setCode) {
            missingSetCode++
            continue
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            missingCollectorNumber++
            continue
        }

        const count = parseInt(cols[countIdx] ?? '0', 10) || 0
        if (count <= 0) {
            invalidQuantities++
            continue
        }

        const key = `${setCode}:${collectorNumber}`
        const existing = merged.get(key) ?? { setCode, collectorNumber, quantityNonfoil: 0, quantityFoil: 0 }

        const isFoil = cols[foilIdx]?.trim().toLowerCase() === 'true'
        if (isFoil) {
            existing.quantityFoil += count
        } else {
            existing.quantityNonfoil += count
        }

        merged.set(key, existing)
    }

    return { cards: Array.from(merged.values()), error: createParsingErrorMessage(missingSetCode, missingCollectorNumber, invalidQuantities) }
}

function parseGoogleDriveCSV(text: string): FileParsingResult {
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
    if (lines.length < 2) {
        const errorMessage = 'File contains no rows'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const headerIdx = lines.findIndex(l => {
        const cols = parseCSVRow(l).map(h => h.trim().toUpperCase())
        return (cols.includes('NAME') || cols.includes('TYPE')) && cols.includes('SET') && cols.includes('NUMBER')
    })
    if (headerIdx === -1) {
        const errorMessage = 'Could not find column headers'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const headers = parseCSVRow(lines[headerIdx]).map(h => h.trim().toUpperCase())
    const col = (name: string) => headers.indexOf(name)
    const nameIdx = col('NAME') !== -1 ? col('NAME') : col('TYPE')
    const setIdx = col('SET')
    const numberIdx = col('NUMBER')
    const quantityIdx = col('QUANTITY')
    const addedIdx = col('ADDED')
    const modifiedIdx = col('LAST MODIFIED')

    const merged = new Map<string, CollectionAddParams>()
    let missingSetCode = 0
    let missingCollectorNumber = 0
    let invalidQuantities = 0
    for (const line of lines.slice(headerIdx + 1)) {
        const cols = parseCSVRow(line)
        const setCode = cols[setIdx]?.trim()
        if (!setCode) {
            missingSetCode++
            continue
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            missingCollectorNumber++
            continue
        }

        const quantity = parseInt(cols[quantityIdx] ?? '0', 10) || 0
        if (quantity <= 0) {
            invalidQuantities++
            continue
        }

        const key = `${setCode}:${collectorNumber}`
        const existing = merged.get(key) ?? {
            setCode,
            collectorNumber,
            quantityNonfoil: 0,
            quantityFoil: 0,
            createdAt: parseDate(cols[addedIdx] ?? ''),
            updatedAt: parseDate(cols[modifiedIdx] ?? ''),
        }

        const name = cols[nameIdx] ?? ''
        const isFoil = name.includes('(F)')
        if (isFoil) {
            existing.quantityFoil += quantity
        } else {
            existing.quantityNonfoil += quantity
        }

        merged.set(key, existing)
    }

    return { cards: Array.from(merged.values()), error: createParsingErrorMessage(missingSetCode, missingCollectorNumber, invalidQuantities) }
}

function parseManaboxCSV(text: string): FileParsingResult {
    const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
    if (lines.length < 2) {
        const errorMessage = 'File contains no rows'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const headers = parseCSVRow(lines[0])
    const col = (name: string) => headers.indexOf(name)
    const quantityIdx = col('Quantity')
    const setCodeIdx = col('Set code')
    const numberIdx = col('Collector number')
    const foilIdx = col('Foil')

    if (setCodeIdx === -1 || numberIdx === -1) {
        const errorMessage = 'Missing Set code and/or Collector number columns'
        logger.warn(errorMessage)
        return { cards: [], error: errorMessage }
    }

    const merged = new Map<string, CollectionAddParams>()
    let missingSetCode = 0
    let missingCollectorNumber = 0
    let invalidQuantities = 0
    for (const line of lines.slice(1)) {
        const cols = parseCSVRow(line)

        const setCode = cols[setCodeIdx]?.trim().toUpperCase()
        if (!setCode) {
            missingSetCode++
            continue
        }

        const collectorNumber = cols[numberIdx]?.trim()
        if (!collectorNumber) {
            missingCollectorNumber++
            continue
        }

        const count = parseInt(cols[quantityIdx] ?? '0', 10) || 0
        if (count <= 0) {
            invalidQuantities++
            continue
        }

        const key = `${setCode}:${collectorNumber}`
        const existing = merged.get(key) ?? { setCode, collectorNumber, quantityNonfoil: 0, quantityFoil: 0 }

        const isFoil = cols[foilIdx] && !(cols[foilIdx].trim().toLowerCase() === 'normal')
        if (isFoil) {
            existing.quantityFoil += count
        } else {
            existing.quantityNonfoil += count
        }

        merged.set(key, existing)
    }

    return { cards: Array.from(merged.values()), error: createParsingErrorMessage(missingSetCode, missingCollectorNumber, invalidQuantities) }
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
