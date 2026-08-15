import { useNavigate, useParams } from 'react-router-dom'
import { Deck } from '../../../models/decks'
import { Pencil, Trash } from 'lucide-react'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { DeckUseIndicator } from '@/components/DeckUseIndicator'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SuggestInput } from '@/components/SuggestInput'
import { capitalize } from '@/lib/utils'

const EMPTY_DECK: Deck = {
    id: '0',
    name: '',
    format: undefined,
    folder: undefined,
    in_use: false,
    created_at: '',
    updated_at: null,
}

interface DeckDialogProps {
    queryClient: QueryClient
    open: boolean
    onOpenChange: (open: boolean) => void
    deck: Deck
}

function DeckUpdateDialog(props: DeckDialogProps) {
    const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

    const [name, setName] = useState(props.deck.name)
    const namesQueryKey = ['decks', 'names']
    const namesQuery = useQuery<string[]>({
        queryKey: namesQueryKey,
        queryFn: () => window.api.decksListDetails('name'),
    })
    const names = namesQuery.data ?? []
    const isDuplicateName = names.includes(name) && props.deck.name !== name
    const isValidName = name.trim() !== '' && !isDuplicateName

    const [format, setFormat] = useState(props.deck.format ?? '')
    const formatsQueryKey = ['decks', 'formats']
    const formatsQuery = useQuery<string[]>({
        queryKey: formatsQueryKey,
        queryFn: () => window.api.decksListDetails('format'),
    })
    const formats = formatsQuery.data ?? []

    const [folder, setFolder] = useState(props.deck.folder ?? '')
    const foldersQueryKey = ['decks', 'folders']
    const foldersQuery = useQuery<string[]>({
        queryKey: foldersQueryKey,
        queryFn: () => window.api.decksListDetails('folder'),
    })
    const folders = foldersQuery.data ?? []

    const [inUse, setInUse] = useState(props.deck.in_use)
    const [saving, setSaving] = useState(false)

    const detailQueryKey = ['decks', 'detail', String(props.deck.id)]
    const listQueryKey = ['decks', 'list']

    async function handleUpdate() {
        if (!isValidName) {
            return
        }

        setSaving(true)
        const result = await window.api.decksUpdate(props.deck.id, {
            name: name,
            format: capitalize(format.trim()) || undefined,
            folder: capitalize(folder.trim()) || undefined,
            in_use: inUse
        })

        setSaving(false)
        if ('error' in result) {
            toast.error(`Failed to update: ${result.error}`)
            return
        }

        toast.success('Deck updated')
        props.queryClient.invalidateQueries({ queryKey: detailQueryKey })
        props.queryClient.invalidateQueries({ queryKey: listQueryKey })

        if (props.deck.name !== name) {
            props.queryClient.invalidateQueries({ queryKey: namesQueryKey })
        }

        if (props.deck.format !== format) {
            props.queryClient.invalidateQueries({ queryKey: formatsQueryKey })
        }

        if (props.deck.folder !== folder) {
            props.queryClient.invalidateQueries({ queryKey: foldersQueryKey })
        }

        props.onOpenChange(false)
    }

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Update deck</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Name</span>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Format</span>
                        <SuggestInput
                            value={format}
                            onChange={setFormat}
                            suggestions={formats}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Folder</span>
                        <SuggestInput
                            value={folder}
                            onChange={setFolder}
                            suggestions={folders}
                        />
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={inUse}
                            onChange={(e) => setInUse(e.target.checked)}
                            className="cursor-pointer"
                        />
                        <span className="text-sm">In use</span>
                    </label>
                </div>

                {isDuplicateName && (
                    <p className="text-xs text-destructive">A deck named &ldquo;{name.trim()}&rdquo; already exists.</p>
                )}

                {!isValidName && (
                    <p className="text-xs text-destructive">The deck name is invalid.</p>
                )}

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={saving || !isValidName}>
                        {saving ? 'Updating...' : 'Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeckDeleteDialog(props: DeckDialogProps) {
    const navigate = useNavigate()
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        const result = await window.api.decksDelete(props.deck.id)

        setDeleting(false)
        if ('error' in result) {
            toast.error(`Failed to delete: ${result.error}`)
        } else {
            toast.success('Deck deleted')
            props.queryClient.invalidateQueries({ queryKey: ['decks', 'detail', String(props.deck.id)] })
            props.queryClient.invalidateQueries({ queryKey: ['decks', 'list'] })
            navigate('/decks')
        }
    }

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Confirm deck deletion</DialogTitle>
                </DialogHeader>
                <p className="text-sm">
                    This will permanently delete {props.deck.name}
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => props.onOpenChange(false)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Removing...' : 'Remove'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function DeckDetailPage() {
    const { id } = useParams<{ id: string }>()
    const queryClient = useQueryClient()
    const deckQuery = useQuery<Deck | null>({
        queryKey: ['decks', 'detail', id],
        queryFn: () => window.api.decksDetail(id ?? '0'),
    })

    const deck = deckQuery.data ?? EMPTY_DECK
    const hasFormat = Boolean(deck.format)
    const hasFolder = Boolean(deck.folder)

    const [openUpdate, setOpenUpdate] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

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
                    <Button
                        onClick={() => setOpenUpdate(true)}
                        title="Edit deck details"
                        variant="outline"
                    >
                        <Pencil className="w-4 h-4" />
                        <span>Edit deck details</span>
                    </Button>
                    <Button
                        onClick={() => setConfirmDelete(true)}
                        title="Delete deck"
                        variant="destructive"
                    >
                        <Trash className="w-4 h-4" />
                        <span>Delete deck</span>
                    </Button>
                </div>
            </div>

            {openUpdate && (
                <DeckUpdateDialog
                    queryClient={queryClient}
                    open={openUpdate}
                    onOpenChange={setOpenUpdate}
                    deck={deck}
                />
            )}

            {confirmDelete && (
                <DeckDeleteDialog
                    queryClient={queryClient}
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    deck={deck}
                />
            )}
        </div>
    )
}
