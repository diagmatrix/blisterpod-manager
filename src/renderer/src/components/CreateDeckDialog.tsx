import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { capitalize } from '@/lib/utils'

interface CreateDeckDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    folders: string[]
    formats: string[]
    existingNames: string[]
}

interface SuggestInputProps {
    value: string
    onChange: (value: string) => void
    suggestions: string[]
    placeholder?: string
}

const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

function SuggestInput({ value, onChange, suggestions, placeholder }: SuggestInputProps) {
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(-1)
    const blurTimer = useRef<ReturnType<typeof setTimeout>>()

    const query = value.trim().toLowerCase()
    const matches = query
        ? suggestions.filter((s) => s.toLowerCase().includes(query))
        : suggestions

    useEffect(() => () => clearTimeout(blurTimer.current), [])

    const isOpen = open && matches.length > 0

    function commit(suggestion: string) {
        onChange(suggestion)
        setOpen(false)
        setHighlighted(-1)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape' && isOpen) {
            e.stopPropagation() // do not let Radix close the whole dialog
            setOpen(false)
            return
        }
        if (!isOpen) {
            if (e.key === 'ArrowDown') setOpen(true)
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((i) => (i + 1) % matches.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((i) => (i <= 0 ? matches.length - 1 : i - 1))
        } else if (e.key === 'Enter' && highlighted >= 0) {
            e.preventDefault()
            commit(matches[highlighted])
        }
    }

    return (
        <div className="relative">
            <input
                value={value}
                placeholder={placeholder}
                className={inputClass}
                onChange={(e) => {
                    onChange(e.target.value)
                    setOpen(true)
                    setHighlighted(-1)
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
                onKeyDown={handleKeyDown}
            />

            {isOpen && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {matches.map((suggestion, i) => (
                        <li key={suggestion}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setHighlighted(i)}
                                onClick={() => commit(suggestion)}
                                className={`flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm ${
                                    i === highlighted ? 'bg-accent text-accent-foreground' : ''
                                }`}
                            >
                                {suggestion}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

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
