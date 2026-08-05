import { useParams } from 'react-router-dom'
import { Deck } from '../../../models/decks'
import { Pencil, Trash } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { DeckUseIndicator } from '@/components/DeckUseIndicator'

const EMPTY_DECK: Deck = {
    id: '0',
    name: '',
    format: undefined,
    folder: undefined,
    in_use: false,
    created_at: '',
    updated_at: null,
}

export default function DeckDetailPage() {
    const { id } = useParams<{ id: string }>()
    const deckQuery = useQuery<Deck | null>({
        queryKey: ['decks', 'detail', id],
        queryFn: () => window.api.decksDetail(id ?? '0'),
    })

    const deck = deckQuery.data ?? EMPTY_DECK
    const hasFormat = Boolean(deck.format)
    const hasFolder = Boolean(deck.folder)

    return (
        <div className="flex flex-col p-3 gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex gap-5">
                        <h1 className="text-3xl font-bold">{
                            deckQuery.isLoading ? 'Loading...' : deck.name || 'Deck not found'
                        }</h1>
                        {!deckQuery.isLoading && !deckQuery.error && (
                            <DeckUseIndicator inUse={deck.in_use} />
                        )}
                    </div>
                    {!deckQuery.isLoading && (hasFormat || hasFolder) && (
                        <span className="text-md text-muted-foreground font-italic">
                            {hasFormat && <span>{deck?.format}</span>}
                            {hasFormat && hasFolder && <span> · </span>}
                            {hasFolder && <span>{deck?.folder}</span>}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {}}
                        title="Edit deck details"
                        className="h-9 px-2 rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 text-sm"
                    >
                        <Pencil className="w-4 h-4" />
                        <span>Edit deck details</span>
                    </button>
                    <button
                        onClick={() => {}}
                        title="Delete deck"
                        className="h-9 px-2 rounded-md border border-input bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground inline-flex items-center gap-1.5 text-sm"
                    >
                        <Trash className="w-4 h-4" />
                        <span>Delete deck</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
