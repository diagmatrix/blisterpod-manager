import { useParams } from 'react-router-dom'

export default function DeckDetailPage() {
    const { name } = useParams<{ name: string }>()

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-3xl font-bold">{name}</h1>
        </div>
    )
}
