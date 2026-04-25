import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Hash, Layers, EuroIcon } from 'lucide-react'
import type { CollectionCard } from '../../../shared/cards'
import type { StatsSummary, StatsColors, StatsRarityEntry, StatsSetEntry } from '../../../shared/stats'
import { SummarySkeleton, ChartSkeleton } from '@/components/skeletons'
import { CollectionImageGrid } from '@/components/CollectionImageGrid'
import { SetBreakdownGrid } from '@/components/SetBreakdownGrid'

const COLOR_ENTRIES: { key: keyof StatsColors; label: string; fill: string }[] = [
  { key: 'white',       label: 'White',     fill: '#E8DCC8' },
  { key: 'blue',        label: 'Blue',      fill: '#3B82F6' },
  { key: 'black',       label: 'Black',     fill: '#4b1d3f' },
  { key: 'red',         label: 'Red',       fill: '#EF4444' },
  { key: 'green',       label: 'Green',     fill: '#198d44' },
  { key: 'colorless',   label: 'Colorless', fill: '#795c5c' },
  { key: 'multicolored',label: 'Multicolor',fill: '#dbce5b' },
]

const RARITY_COLORS: Record<string, string> = {
  common:   '#434549',
  uncommon: '#94A3B8',
  rare:     '#d6c147',
  mythic:   '#F97316',
  special:  '#A855F7',
  bonus:    '#EC4899',
  unknown:  '#206134',
}

function SummaryCards({ data }: { data: StatsSummary }) {
  const cards = [
    {
      label: 'Unique Printings',
      value: data.uniquePrintings.toLocaleString(),
      icon: Hash,
      sub: 'distinct set + collector number',
    },
    {
      label: 'Unique Card Names',
      value: data.uniqueNames.toLocaleString(),
      icon: Hash,
      sub: 'distinct card names',
    },
    {
      label: 'Total Copies',
      value: data.totalCards.toLocaleString(),
      icon: Layers,
      sub: 'across all printings',
    },
    {
      label: 'Estimated Value',
      value: `${data.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: EuroIcon,
      sub: 'EUR (Scryfall prices)',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, sub }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs uppercase tracking-wide font-medium">{label}</span>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      ))}
    </div>
  )
}

function ColorChart({ data }: { data: StatsColors }) {
  const chartData = COLOR_ENTRIES
    .map(e => ({ name: e.label, value: data[e.key] ?? 0, fill: e.fill }))
    .filter(d => d.value > 0)

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <h3 className="text-sm font-semibold">Color Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              (percent ?? 0) > 0.04 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Copies']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Rarity bar chart ───────────────────────────────────────────
function RarityChart({ data }: { data: StatsRarityEntry[] }) {
  const chartData = data.map(d => ({
    rarity: d.rarity.charAt(0).toUpperCase() + d.rarity.slice(1),
    count: d.totalCards,
    fill: RARITY_COLORS[d.rarity] ?? '#6B7280',
  }))

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <h3 className="text-sm font-semibold">Rarity Breakdown</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="rarity" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip formatter={(v) => [Number(v).toLocaleString(), 'Copies']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const summary = useQuery<StatsSummary>({
    queryKey: ['stats', 'summary'],
    queryFn: () => window.api.statsSummary(),
  })

  const colors = useQuery<StatsColors>({
    queryKey: ['stats', 'colors'],
    queryFn: () => window.api.statsColors(),
  })

  const rarity = useQuery<StatsRarityEntry[]>({
    queryKey: ['stats', 'rarity'],
    queryFn: () => window.api.statsRarity(),
  })

  const bySet = useQuery<StatsSetEntry[]>({
    queryKey: ['stats', 'by-set'],
    queryFn: () => window.api.statsBySet({ limit: 12 }),
  })

  const topValue = useQuery<CollectionCard[]>({
    queryKey: ['stats', 'top-value'],
    queryFn: () => window.api.statsTopValue({ limit: 12 }),
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Statistics</h1>
        <p className="text-muted-foreground text-sm">Overview of your collection.</p>
      </div>

      {summary.isLoading ? <SummarySkeleton /> : summary.isError ? (
        <p className="text-sm text-destructive">Failed to load summary stats.</p>
      ) : summary.data ? (
        <SummaryCards data={summary.data} />
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Top {topValue.data?.length} most valuable cards</h2>
        {topValue.isLoading ? <ChartSkeleton /> : topValue.isError ? (
          <p className="text-sm text-destructive">Failed to load top value cards.</p>
        ) : topValue.data ? (
          <CollectionImageGrid
            cards={topValue.data}
            onCardClick={(card) => navigate(`/card-detail/${card.set_code}/${card.collector_number}`)}
          />
        ) : null}
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Top {bySet.data?.length} most collected sets</h2>
      {bySet.isLoading ? <ChartSkeleton /> : bySet.isError ? (
        <p className="text-sm text-destructive">Failed to load set data.</p>
      ) : bySet.data ? (
        <SetBreakdownGrid data={bySet.data} />
      ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {colors.isLoading ? <ChartSkeleton /> : colors.isError ? (
          <p className="text-sm text-destructive">Failed to load color data.</p>
        ) : colors.data ? (
          <ColorChart data={colors.data} />
        ) : null}

        {rarity.isLoading ? <ChartSkeleton /> : rarity.isError ? (
          <p className="text-sm text-destructive">Failed to load rarity data.</p>
        ) : rarity.data ? (
          <RarityChart data={rarity.data} />
        ) : null}
      </div>
    </div>
  )
}
