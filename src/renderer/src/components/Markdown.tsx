import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownProps {
    source: string
    className?: string
    headingOffset?: number // Demotes every heading by this many levels
}

interface Heading {
    kind: 'heading'
    level: number
    text: string
}

interface List {
    kind: 'list'
    items: string[]
}

interface Paragraph {
    kind: 'paragraph'
    text: string
}


type Block = Heading | List | Paragraph

// Link, bold, and inline code, in one pass so they can appear in any order.
const INLINE_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g

const HEADING_CLASSES: Record<number, string> = {
    1: 'text-2xl font-bold text-foreground',
    2: 'text-lg font-semibold text-foreground',
    3: 'text-base font-semibold text-foreground pt-3',
    4: 'text-sm font-semibold text-foreground pt-1',
    5: 'text-sm font-semibold text-foreground',
    6: 'text-sm font-semibold text-foreground',
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = []
    const pattern = new RegExp(INLINE_PATTERN.source, 'g')
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > cursor) {
            nodes.push(text.slice(cursor, match.index))
        }

        const [raw, linkText, href, bold, code] = match
        const key = `${keyPrefix}-${match.index}`

        if (href !== undefined) {
            nodes.push(
                <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                >
                    {linkText}
                </a>
            )
        } else if (bold !== undefined) {
            nodes.push(
                <strong key={key} className="font-semibold text-foreground">
                    {bold}
                </strong>
            )
        } else {
            nodes.push(
                <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
                    {code}
                </code>
            )
        }

        cursor = match.index + raw.length
    }

    if (cursor < text.length) {
        nodes.push(text.slice(cursor))
    }

    return nodes
}

export function parseMarkdown(source: string): Block[] {
    const blocks: Block[] = []
    let paragraph: string[] = []
    let list: string[] | null = null

    const flushParagraph = () => {
        if (paragraph.length === 0) {
            return
        }

        blocks.push({ kind: 'paragraph', text: paragraph.join(' ') })
        paragraph = []
    }

    const flushList = () => {
        if (list === null) {
            return
        }

        blocks.push({ kind: 'list', items: list })
        list = null
    }

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim()

        if (line === '') {
            flushParagraph()
            flushList()
            continue
        }

        const heading = /^(#{1,6})\s+(.+)$/.exec(line)
        if (heading) {
            flushParagraph()
            flushList()
            blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] })
            continue
        }

        const item = /^[-*]\s+(.+)$/.exec(line)
        if (item) {
            flushParagraph()
            list ??= []
            list.push(item[1])
            continue
        }

        // A plain line continues the list item or paragraph it is wrapped under.
        if (list !== null) {
            list[list.length - 1] += ` ${line}`
        } else {
            paragraph.push(line)
        }
    }

    flushParagraph()
    flushList()

    return blocks
}

export function Markdown({ source, className, headingOffset = 0, }: MarkdownProps) {
    const blocks = parseMarkdown(source)

    return (
        <div className={cn('space-y-3 text-sm text-muted-foreground', className)}>
            {blocks.map((block, index) => {
                const key = `${block.kind}-${index}`

                if (block.kind === 'heading') {
                    const level = Math.min(block.level + headingOffset, 6)
                    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
                    return (
                        <Tag key={key} className={HEADING_CLASSES[level]}>
                            {renderInline(block.text, key)}
                        </Tag>
                    )
                }

                if (block.kind === 'list') {
                    return (
                        <ul key={key} className="list-disc space-y-2 pl-5">
                            {block.items.map((item, itemIndex) => (
                                <li key={`${key}-${itemIndex}`}>
                                    {renderInline(item, `${key}-${itemIndex}`)}
                                </li>
                            ))}
                        </ul>
                    )
                }

                return <p key={key}>{renderInline(block.text, key)}</p>
            })}
        </div>
    )
}
