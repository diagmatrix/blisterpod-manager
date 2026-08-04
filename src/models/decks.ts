export interface Deck {
    id: string
    name: string
    format?: string
    folder?: string
    in_use: boolean
    created_at: string
    updated_at?: string | null
}

export interface DeckFolder {
    name: string
    decks: Deck[]
}

export const BASE_DECK_FOLDER = 'Uncategorized'

export function groupByFolder(decks: Deck[]): DeckFolder[] {
    const groups = new Map<string, Deck[]>()
    for (const deck of decks) {
        const folder = deck.folder ?? BASE_DECK_FOLDER

        const existing = groups.get(folder)
        if (existing) {
            existing.push(deck)
        } else {
            groups.set(folder, [deck])
        }
    }

    return [...groups.entries()]
        .map(([name, folderDecks]) => ({ name, decks: folderDecks }))
        .sort((a, b) => {
            if (a.name === BASE_DECK_FOLDER) {
                return -1
            } else if (b.name === BASE_DECK_FOLDER) {
                return 1
            }
            return a.name.localeCompare(b.name)
        })
}
