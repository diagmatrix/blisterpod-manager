import type { CollectionAddParams } from '../../../models/search'

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
  if (!s) return undefined
  const parts = s.split('/')
  if (parts.length !== 3) return undefined
  const [day, month, year] = parts
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

export function parseBlisterpodCSV(text: string): CollectionAddParams[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
  if (lines.length < 2) return []

  const headers = parseCSVRow(lines[0])
  const col = (name: string) => headers.indexOf(name)
  const setIdx = col('set_code')
  const numberIdx = col('collector_number')
  const nonfoilIdx = col('quantity_nonfoil')
  const foilIdx = col('quantity_foil')
  const createdIdx = col('created_at')
  const updatedIdx = col('updated_at')

  if (setIdx === -1 || numberIdx === -1) return []

  return lines.slice(1).flatMap(line => {
    const cols = parseCSVRow(line)
    const setCode = cols[setIdx]?.trim()
    const collectorNumber = cols[numberIdx]?.trim()
    const quantityNonfoil = parseInt(cols[nonfoilIdx] ?? '0', 10) || 0
    const quantityFoil = parseInt(cols[foilIdx] ?? '0', 10) || 0
    if (!setCode || !collectorNumber || quantityNonfoil + quantityFoil === 0) return []

    return [{
      setCode,
      collectorNumber,
      quantityNonfoil,
      quantityFoil,
      createdAt: cols[createdIdx]?.trim() || undefined,
      updatedAt: cols[updatedIdx]?.trim() || undefined,
    }]
  })
}

export function parseMoxfieldCSV(text: string): CollectionAddParams[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
  if (lines.length < 2) return []

  const headers = parseCSVRow(lines[0])
  const col = (name: string) => headers.indexOf(name)
  const countIdx = col('Count')
  const editionIdx = col('Edition')
  const numberIdx = col('Collector Number')
  const foilIdx = col('Foil')

  if (editionIdx === -1 || numberIdx === -1) return []

  const merged = new Map<string, CollectionAddParams>()

  for (const line of lines.slice(1)) {
    const cols = parseCSVRow(line)
    const setCode = cols[editionIdx]?.trim().toUpperCase()
    const collectorNumber = cols[numberIdx]?.trim()
    const count = parseInt(cols[countIdx] ?? '0', 10) || 0
    const isFoil = cols[foilIdx]?.trim().toLowerCase() === 'true'

    if (!setCode || !collectorNumber || count <= 0) continue

    const key = `${setCode}:${collectorNumber}`
    const existing = merged.get(key) ?? { setCode, collectorNumber, quantityNonfoil: 0, quantityFoil: 0 }
    if (isFoil) existing.quantityFoil += count
    else existing.quantityNonfoil += count
    merged.set(key, existing)
  }

  return Array.from(merged.values())
}

export function parseGoogleDriveCSV(text: string): CollectionAddParams[] {
  const lines = text.split('\n').map(l => l.trimEnd()).filter(l => l)
  const headerIdx = lines.findIndex(l => {
    const cols = parseCSVRow(l).map(h => h.trim().toUpperCase())
    return (cols.includes('NAME') || cols.includes('TYPE')) && cols.includes('SET') && cols.includes('NUMBER')
  })
  if (headerIdx === -1) return []

  const headers = parseCSVRow(lines[headerIdx]).map(h => h.trim().toUpperCase())
  const col = (name: string) => headers.indexOf(name)
  const nameIdx = col('NAME') !== -1 ? col('NAME') : col('TYPE')
  const setIdx = col('SET')
  const numberIdx = col('NUMBER')
  const quantityIdx = col('QUANTITY')
  const addedIdx = col('ADDED')
  const modifiedIdx = col('LAST MODIFIED')

  const merged = new Map<string, CollectionAddParams>()

  for (const line of lines.slice(headerIdx + 1)) {
    const cols = parseCSVRow(line)
    const name = cols[nameIdx] ?? ''
    const isFoil = name.includes('(F)')
    const quantity = parseInt(cols[quantityIdx] ?? '0', 10)
    if (!quantity || quantity <= 0) continue

    const setCode = cols[setIdx]?.trim()
    const collectorNumber = cols[numberIdx]?.trim()
    if (!setCode || !collectorNumber) continue

    const key = `${setCode}:${collectorNumber}`
    const existing = merged.get(key) ?? {
      setCode,
      collectorNumber,
      quantityNonfoil: 0,
      quantityFoil: 0,
      createdAt: parseDate(cols[addedIdx] ?? ''),
      updatedAt: parseDate(cols[modifiedIdx] ?? ''),
    }
    if (isFoil) existing.quantityFoil += quantity
    else existing.quantityNonfoil += quantity
    merged.set(key, existing)
  }

  return Array.from(merged.values())
}
