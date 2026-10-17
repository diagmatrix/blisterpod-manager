export function DeckUseIndicator({ inUse }: { inUse: boolean }) {
    const inUseClass = inUse ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
    const inUseLabel = inUse ? 'In use' : 'Idle'

    return (
        <span
            className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium ${inUseClass}`}
        >
            {inUseLabel}
        </span>
    )
}
