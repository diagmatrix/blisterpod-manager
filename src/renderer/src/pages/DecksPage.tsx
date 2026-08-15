import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, Folder, FolderOpen, Plus, Search } from 'lucide-react'
import { BASE_DECK_FOLDER, Deck, DeckFolder, filterDeckFolders } from '../../../models/decks'
import { CreateDeckDialog } from '@/components/CreateDeckDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionHeader } from '@/components/SectionHeader'
import { useQuery } from '@tanstack/react-query'
import { PaginatedResult } from '../../../models/responses'
import { TableSkeleton } from '@/components/skeletons'
import { DeckUseIndicator } from '@/components/DeckUseIndicator'

const EMPTY_PAGE: PaginatedResult<DeckFolder> = { rows: [], total: 0 }

interface DeckFolderSectionProps {
    folder: DeckFolder
    collapsed: Set<string>
    toggleFolder: (name: string) => void
    onSelectDeck: (deck: Deck) => void
}

type InUseFilter = 'all' | 'inUse' | 'notInUse'

const IN_USE_OPTIONS: { value: InUseFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'inUse', label: 'In use' },
    { value: 'notInUse', label: 'Not in use' },
]

function DeckRow(deck: Deck, onSelect: (deck: Deck) => void) {
    return (
        <tr
            key={deck.id}
            onClick={() => onSelect(deck)}
            className="border-t border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
        >
            <td className="px-3 py-1.5 pl-9 truncate font-medium">{deck.name}</td>
            <td className="px-3 py-1.5 w-32 text-muted-foreground">
                {deck.format ?? '-'}
            </td>
            <td className="px-3 py-1.5 w-24 text-center">
                <DeckUseIndicator inUse={deck.in_use} />
            </td>
            <td className="px-3 py-1.5 w-28 text-center tabular-nums text-muted-foreground">
                {deck.created_at}
            </td>
            <td className="px-3 py-1.5 w-28 text-center tabular-nums text-muted-foreground">
                {deck.updated_at ?? '-'}
            </td>
        </tr>
    )
}

function DeckFolderSection({ folder, collapsed, toggleFolder, onSelectDeck }: DeckFolderSectionProps) {
    const expanded = !collapsed.has(folder.name)

    return (
        <div key={folder.name} className="rounded-md border border-border overflow-hidden">
            <button
                onClick={() => toggleFolder(folder.name)}
                className="flex items-center gap-2 w-full px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                {expanded ? (
                    <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm">{folder.name}</span>
                <span className="ml-auto rounded-full bg-background border border-border px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {folder.decks.length}
                </span>
            </button>

            {expanded && (
                <table className="w-full text-sm">
                    <tbody>
                        {folder.decks.map((deck) => DeckRow(deck, onSelectDeck))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default function DecksPage() {
    const decksQuery = useQuery<PaginatedResult<DeckFolder>>({
        queryKey: ['decks', 'list'],
        queryFn: () => window.api.decksList(),
    })
    const { rows: folderRows, total } = decksQuery.data ?? EMPTY_PAGE

    const [isFilterExpanded, setIsFilterExpanded] = useState(true)
    const toggleFilter = () => setIsFilterExpanded((prev) => !prev)

    const [searchInput, setSearchInput] = useState('')
    const [formatFilter, setFormatFilter] = useState('all')
    const [inUseFilter, setInUseFilter] = useState<InUseFilter>('all')
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const [createOpen, setCreateOpen] = useState(false)
    const navigate = useNavigate()

    const folders = useMemo(
        () => filterDeckFolders(
            folderRows,
            searchInput.trim() || undefined,
            formatFilter === 'all' ? undefined : formatFilter,
            inUseFilter === 'all' ? undefined : inUseFilter === 'inUse',
        ),
        [folderRows, searchInput, formatFilter, inUseFilter]
    )
    const shownCount = useMemo(() => folders.reduce((n, f) => n + f.decks.length, 0), [folders])

    const formats = useMemo(
        () => [
            ...new Set(folderRows.flatMap((f) => f.decks).map((d) => d.format).filter((f): f is string => !!f)),
        ].sort(),
        [folderRows]
    )
    const folderNames = useMemo(
        () => folderRows.map((f) => f.name).filter((n) => n !== BASE_DECK_FOLDER),
        [folderRows]
    )
    const deckNames = useMemo(
        () => folderRows.flatMap((f) => f.decks).map((d) => d.name),
        [folderRows]
    )

    const toggleFolder = (name: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev)
            if (next.has(name)) {
                next.delete(name)
            } else {
                next.add(name)
            }

            return next
        })
    }

    const openDeck = (deck: Deck) => navigate(`/decks/${encodeURIComponent(deck.id)}`)

    return (
        <div className="flex flex-col p-3 gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Decks</h1>
                    <p className="text-sm text-muted-foreground">
                        {decksQuery.isLoading
                            ? 'Loading ...'
                            : `${shownCount.toLocaleString()} of ${total.toLocaleString()} decks`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateOpen(true)}
                        title="Add new deck"
                        className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create new deck</span>
                    </button>
                    <button
                        onClick={() => {}}
                        title="Import deck"
                        className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Import deck</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-md border border-border px-3 py-2 flex flex-col gap-2">
                <SectionHeader label="Filter by" expanded={isFilterExpanded} onToggle={toggleFilter} />
                {isFilterExpanded && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Deck name ..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-9 w-48 rounded-md border border-input bg-background px-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="h-6 w-px bg-border mx-1" />

                        {/* Format */}
                        <Select value={formatFilter} onValueChange={setFormatFilter}>
                            <SelectTrigger className="h-9 w-40">
                                <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All formats</SelectItem>
                                {formats.map((format) => (
                                    <SelectItem key={format} value={format}>
                                        {format}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="h-6 w-px bg-border mx-1" />

                        {/* In use segmented control */}
                        <div className="flex items-center rounded-md border border-input overflow-hidden">
                            {IN_USE_OPTIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setInUseFilter(value)}
                                    className={`h-9 px-3 text-sm ${inUseFilter === value
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Folders */}
            {decksQuery.isLoading ? (
                <TableSkeleton rows={5} />
            ) : decksQuery.isError ? (
                <p className="text-sm text-destructive py-8 text-center">Could not load decks.</p>
            ) : folders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                    {total === 0 ? 'No decks yet.' : 'No decks match the current filters.'}
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {folders.map((folder) => (
                        <DeckFolderSection
                            key={folder.name}
                            folder={folder}
                            collapsed={collapsed}
                            toggleFolder={toggleFolder}
                            onSelectDeck={openDeck}
                        />
                    ))}
                </div>
            )}

            <CreateDeckDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                folders={folderNames}
                formats={formats}
                existingNames={deckNames}
            />
        </div>
    )
}
