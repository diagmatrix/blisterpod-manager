import { useEffect, useRef, useState } from "react"

interface SuggestInputProps {
    value: string
    onChange: (value: string) => void
    suggestions: string[]
    placeholder?: string
}

const INPUT_CLASS = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export function SuggestInput({ value, onChange, suggestions, placeholder }: SuggestInputProps) {
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
                className={INPUT_CLASS}
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
