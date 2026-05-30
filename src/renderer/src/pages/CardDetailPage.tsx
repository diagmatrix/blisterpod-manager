import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import { ManaSymbols } from '@/components/ManaSymbols'
import { parseJsonArray, parseOracleText } from '@/lib/utils'
import { getManaSymbolUrl } from '../../../shared/mana'
import { CardDetailsSkeleton, TableSkeleton } from '@/components/skeletons'
import { CardDetail, CollectionCard } from '../../../shared/cards'
import { SetSymbol } from '@/components/SetSymbol'

interface OtherPrintingProps {
  printings: CollectionCard[]
  navigate: ReturnType<typeof useNavigate>
}

function OtherPrintingsTable({ printings, navigate }: OtherPrintingProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2 font-medium w-2/5">Set</th>
            <th className="text-center px-4 py-2 font-medium">Code</th>
            <th className="text-right px-4 py-2 font-medium">Number</th>
            <th className="text-right px-4 py-2 font-medium">Nonfoil</th>
            <th className="text-right px-4 py-2 font-medium">Foil</th>
            <th className="text-right px-4 py-2 font-medium">Total</th>
            <th className='text-right px-4 py-2 font-medium'>€</th>
          </tr>
        </thead>
        <tbody>
          {printings.map((p) => (
            <tr
              key={`${p.set_code}-${p.collector_number}`}
              className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
              onClick={() => navigate(`/card-detail/${p.set_code}/${p.collector_number}`)}
            >
              <td className="px-4 py-2">{p.set_name}</td>
              <td className="px-4 py-2 text-center text-muted-foreground">{p.set_code.toUpperCase()}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">{p.collector_number}</td>
              <td className="px-4 py-2 text-right">{p.quantity_nonfoil}</td>
              <td className="px-4 py-2 text-right">{p.quantity_foil}</td>
              <td className="px-4 py-2 text-right font-medium">{p.total}</td>
              <td className="px-4 py-2 text-right font-medium">{p.value}€</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CardHeaderProps {
  name: string | null
  setName: string
  setCode: string
  collectorNumber: string
  rarity: string | null
  typeLine: string | null
}

function CardHeader(props: CardHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap justify-start">
        <h1 className="text-2xl font-bold">{props.name}</h1>
      </div>
      <p className="text-sm mt-1">
        <span className="font-medium">{props.setName}</span>
        <span className="text-muted-foreground ml-2">({props.setCode.toUpperCase()})</span>
        <SetSymbol setCode={props.setCode} size={'1.5rem'} rarity={props.rarity} setName={props.setName} collectorNumber={props.collectorNumber}/>
      </p>
      {props.typeLine && (
        <p className="text-sm text-muted-foreground mt-1">{props.typeLine}</p>
      )}
    </div>
  )
}

interface CardManaProps {
  manaCosts: string | null
  colorIdentity: string | null
  isMultiFace: boolean
  faceIndex: number
}

function CardMana(props: CardManaProps) {
  const mana = parseJsonArray(props.manaCosts ?? '[]')
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Mana Cost{props.isMultiFace && 's'}
      </p>
      {props.isMultiFace && (
        <div className="flex items-center gap-1">
          {mana[0] ? (
            <ManaSymbols value={mana[0] ?? '[]'} isManaCost={true} />
          ) : <p className='text-muted-foreground text-xs font-bold'>&mdash;</p>}
          <span className='text-sm text-muted-foreground'>{' '}//{' '}</span>
          {mana[1] ? (
            <ManaSymbols value={mana[1] ?? '[]'} isManaCost={true} />
          ) : <p className='text-muted-foreground text-xs font-bold'>&mdash;</p>}
        </div>
      )}
      {!props.isMultiFace && (
        <div className="flex items-center gap-1">
          {mana[0] ? (
            <ManaSymbols value={mana[0] ?? '[]'} isManaCost={true} />
          ) : <p className='text-muted-foreground text-xs font-bold'>&mdash;</p>}
        </div>
      )}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Color Identity
      </p>
      <ManaSymbols value={props.colorIdentity ?? '[]'} />
    </div>
  )
}

function renderOracleSegments(text: string) {
  const segments = parseOracleText(text)
  return segments.map((seg, i) => {
    if (seg.type === 'newline') return <br key={i} />
    if (seg.type === 'mana') return <img key={i} src={getManaSymbolUrl(seg.symbol)} alt={seg.symbol} width={14} height={14} className="inline-block align-middle mx-0.5" />
    return <span key={i}>{seg.content}</span>
  })
}

function OracleText({ oracle }: { oracle: string[] }) {
  const isMultiFace = oracle.length > 1
  return (
    <div className='flex gap-4 flex-col md:flex-row '>
      {oracle[0] ? (
        <p className="text-sm leading-relaxed flex-1">{renderOracleSegments(oracle[0])}</p>
      ) : <p className='text-muted-foreground text-sm font-bold'>No oracle text.</p>}
      {isMultiFace && <div className="w-px bg-border self-stretch" />}
      {isMultiFace && oracle[1] ? (
        <p className="text-sm leading-relaxed flex-1">{renderOracleSegments(oracle[1])}</p>
      ) : isMultiFace ? <p className='text-muted-foreground text-sm font-bold'>No oracle text.</p> : null}
    </div>
  )
}

interface CollectionTotals {
  quantity_nonfoil: number
  quantity_foil: number
  total: number
  value: number
}

function getCollectionTotals(baseCard: CardDetail, otherPrintings: CollectionCard[]): CollectionTotals {
  const quantity_nonfoil = baseCard.quantity_nonfoil + otherPrintings.reduce((sum, card) => sum + card.quantity_nonfoil, 0)
  const quantity_foil = baseCard.quantity_foil + otherPrintings.reduce((sum, card) => sum + card.quantity_foil, 0)
  const total = quantity_nonfoil + quantity_foil
  const value = (baseCard.value ?? 0) + otherPrintings.reduce((sum, card) => sum + (card.value ?? 0), 0)
  return { quantity_nonfoil, quantity_foil, total, value }
}

interface CollectionInfoProps {
  card: CardDetail
  otherPrintings: CollectionCard[]
}

function CollectionInfo({ card, otherPrintings }: CollectionInfoProps) {
  const totals = getCollectionTotals(card, otherPrintings)
  return (
    <>
    <h2 className="text-lg font-semibold mb-3">Collection information</h2>
    <div className='flex flex-column md:flex-row gap-4'>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          This printing
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Nonfoil</p>
            <p className="text-xl font-bold">{card.quantity_nonfoil}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Foil</p>
            <p className="text-xl font-bold">{card.quantity_foil}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{card.total}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Value</p>
            <p className="text-xl font-bold">{(card.value ?? 0).toFixed(2)}€</p>
          </div>
        </div>
      </div>
      {otherPrintings.length > 0 && (
        <div className='ml-4'>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Collection
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Nonfoil</p>
              <p className="text-xl font-bold">{totals.quantity_nonfoil}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Foil</p>
              <p className="text-xl font-bold">{totals.quantity_foil}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{totals.total}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Value</p>
              <p className="text-xl font-bold">{totals.value.toFixed(2)}€</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default function CardDetailPage() {
  const navigate = useNavigate()
  const { setCode, collectorNumber } = useParams<{ setCode: string; collectorNumber: string }>()
  const [faceIndex, setFaceIndex] = useState(0)
  const [imgErrored, setImgErrored] = useState(false)

  const params = { set_code: setCode!, collector_number: collectorNumber! }
  const enabled = !!setCode && !!collectorNumber

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['card-detail', setCode, collectorNumber],
    queryFn: () => window.api.cardDetail(params),
    enabled,
  })
  
  const card = detailData && !('error' in detailData) ? detailData : null
  const imageUrls = parseJsonArray(card?.image_urls)
  const oracleTexts = parseJsonArray(card?.oracle_texts)
  const isMultiFace = imageUrls.length > 1
  const currentImageUrl = imageUrls[faceIndex] ?? null
  const activeScryfallId = (faceIndex === 1 && card?.meld_scryfall_id) ? card.meld_scryfall_id : card?.scryfall_id
  const imageSrc =
    !imgErrored && activeScryfallId && currentImageUrl
      ? `card-image://${activeScryfallId}?u=${encodeURIComponent(currentImageUrl)}`
      : null

  const { data: printingsData, isLoading: printingsLoading } = useQuery({
    queryKey: ['card-other-printings', card?.oracle_id, card?.scryfall_id],
    queryFn: () => window.api.cardOtherPrintings({ oracle_id: card?.oracle_id ?? '', scryfall_id: card?.scryfall_id ?? '' }),
    enabled: !!card,
  })

  const otherPrintings = printingsData?.other_printings ?? []

  if (detailLoading) {
    return (
      <div className="p-6 space-y-4">
        <CardDetailsSkeleton />
        <TableSkeleton rows={3} />
      </div>
    )
  }

  return (
  <div className="p-6 space-y-4">
    <Button variant="outline" size="sm" onClick={() => navigate('/collection')}><ArrowLeft className='h-3 w-3'/> To collection</Button>
    {!card ? (
      <p className="text-muted-foreground">
        Card not found: {setCode?.toUpperCase()} #{collectorNumber}
      </p>
    ) : (
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
          {/* Card image */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 space-y-2">
            <div
              className="aspect-[488/680] rounded-xl overflow-hidden border bg-muted"
              onClick={() => { if (isMultiFace) { setFaceIndex((i) => (i + 1) % imageUrls.length); setImgErrored(false) } }}
              style={{ cursor: isMultiFace ? 'pointer' : undefined }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={card.name ?? 'Card image'}
                  onError={() => setImgErrored(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  {card.name}
                </div>
              )}
            </div>
            {isMultiFace && (
              <p className="text-xs text-center text-muted-foreground">
                Face {faceIndex + 1} of {imageUrls.length} — click to flip
              </p>
            )}
          </div>

          {/* Card details */}
          <div className="flex-1 space-y-4 min-w-0 justify-between">
            <div className='flex items-center gap-4 flex-wrap'>
              <div className='flex-1'>
                <CardHeader
                  name={card?.name ?? 'Unknown'}
                  setName={card.set_name}
                  setCode={card.base_set_code}
                  collectorNumber={card.collector_number}
                  rarity={card.rarity}
                  typeLine={card.type_line}
                />
              </div>
              <div className="w-px bg-border self-stretch" />
              <div className='flex-2'>
                <CardMana
                  manaCosts={card.mana_costs}
                  colorIdentity={card.color_identity}
                  isMultiFace={isMultiFace}
                  faceIndex={faceIndex}
                />
              </div>
            </div>        
            <Separator />
            <OracleText oracle={oracleTexts} />
        </div>

        {/* Other printings */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-3">Other printings in your collection</h2>
          {printingsLoading && (
          <TableSkeleton rows={3} />
          )}
          {otherPrintings.length > 0 ?(
            <OtherPrintingsTable printings={otherPrintings} navigate={navigate} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No other printings of {card?.name ?? 'Unknown'} in your collection.
            </p>
          )}
        </div>
        </div>

        {/* Info */}
        <CollectionInfo card={card} otherPrintings={otherPrintings} />
      </div>
    )}
    </div>
  )
}
