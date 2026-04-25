import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type OracleSegment =
  | { type: 'text'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'mana'; symbol: string }
  | { type: 'newline' }

function pushTextSegments(segments: OracleSegment[], text: string) {
  const chunks = text.split(/(\([^)]*\))/g)
  for (const chunk of chunks) {
    if (!chunk) continue
    if (chunk.startsWith('(') && chunk.endsWith(')')) {
      segments.push({ type: 'italic', content: chunk })
    } else {
      segments.push({ type: 'text', content: chunk })
    }
  }
}

export function parseOracleText(text: string): OracleSegment[] {
  const segments: OracleSegment[] = []
  const parts = text.split(/(\{[^}]+\})/g)
  for (const part of parts) {
    if (/^\{[^}]+\}$/.test(part)) {
      segments.push({ type: 'mana', symbol: part.slice(1, -1).toUpperCase() })
    } else {
      const lines = part.split('\n')
      lines.forEach((line, i) => {
        if (line) pushTextSegments(segments, line)
        if (i < lines.length - 1) segments.push({ type: 'newline' })
      })
    }
  }
  return segments
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const sanitized = value.replace(/[\n\r\t]/g, (c) =>
      c === '\n' ? '\\n' : c === '\r' ? '\\r' : '\\t'
    )
    const parsed = JSON.parse(sanitized)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}
