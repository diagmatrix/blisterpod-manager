import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { capitalize } from '@/lib/utils'
import { SuggestInput } from './SuggestInput'

interface CreateDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    folders: string[]
    formats: string[]
    existingNames: string[]
}

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export function CreateDeckDialog({ open, onOpenChange, folders, formats, existingNames }: CreateDeckDialogProps) {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [format, setFormat] = useState('')
    const [folder, setFolder] = useState('')
    const [inUse, setInUse] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setName('')
            setFormat('')
            setFolder('')
            setInUse(false)
            setSaving(false)
        }
    }, [open])

    const PLACEHOLDER_NAME = 'Eldrazi Tron'
    const PLACEHOLDER_FORMAT = 'Commander'
    const PLACEHOLDER_FOLDER = 'Leave empty for no folder'

    const trimmedName = name.trim()
    const isDuplicate = existingNames.includes(trimmedName)
    const isValid = trimmedName !== '' && !isDuplicate

    async function handleCreate() {
        if (!isValid) {
            return
        }
        setSaving(true)

        const result = await window.api.decksCreate({
            name: trimmedName,
            format: capitalize(format.trim()) || undefined,
            folder: capitalize(folder.trim()) || undefined,
            in_use: inUse,
        })
        setSaving(false)

        if (!result.success) {
            toast.error(result.error ?? 'Failed to create deck')
            return
        }

        toast.success(`Created ${trimmedName}`)
        queryClient.invalidateQueries({ queryKey: ['decks'] })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create new deck</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Name</span>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handleCreate() }}
                            placeholder={PLACEHOLDER_NAME}
                            className={inputClass}
                        />
                    </label>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Format</span>
                        <SuggestInput
                            value={format}
                            onChange={setFormat}
                            suggestions={formats}
                            placeholder={PLACEHOLDER_FORMAT}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Folder</span>
                        <SuggestInput
                            value={folder}
                            onChange={setFolder}
                            suggestions={folders}
                            placeholder={PLACEHOLDER_FOLDER}
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

                    {isDuplicate && (
                        <p className="text-xs text-destructive">A deck named &ldquo;{trimmedName}&rdquo; already exists.</p>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!isValid || saving}>
                        {saving ? 'Creating…' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
