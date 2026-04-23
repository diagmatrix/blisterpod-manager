import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/ThemeProvider'
import { RefreshLoadingDialog } from '@/components/RefreshLoadingDialog'
import { injectKeyruneCSS } from '@/lib/keyruneCSS'
import type { KeyruneVersion } from '../../../shared/types'

function SettingsSection({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SettingsRow({ label, description, children }: {
  label: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const [logPath, setLogPath] = useState<string>('')
  const [keyruneVersion, setKeyruneVersion] = useState<KeyruneVersion | null>(null)
  const [setsLastRefreshed, setSetsLastRefreshed] = useState<string | null>(null)
  const [cardsLastRefreshed, setCardsLastRefreshed] = useState<string | null>(null)

  const [refreshAllPending, setRefreshAllPending] = useState(false)
  const [refreshCardsPending, setRefreshCardsPending] = useState(false)
  const [refreshSetsPending, setRefreshSetsPending] = useState(false)
  const [refreshManaSymbolsPending, setRefreshManaSymbolsPending] = useState(false)
  const [refreshSetSymbolsPending, setRefreshSetSymbolsPending] = useState(false)

  const isAnyRefreshPending =
    refreshAllPending ||
    refreshCardsPending ||
    refreshSetsPending ||
    refreshManaSymbolsPending ||
    refreshSetSymbolsPending

  useEffect(() => {
    window.api.logPath().then(setLogPath)
    window.api.keyruneVersion().then(setKeyruneVersion)
    window.api.settingsGet('setsLastRefreshed').then((v) => setSetsLastRefreshed(v ?? null))
    window.api.settingsGet('cardsLastRefreshed').then((v) => setCardsLastRefreshed(v ?? null))
  }, [])

  // Placeholder handlers — will be wired to Scryfall API in a future ticket
  const handleRefreshAll = async () => {
    setRefreshAllPending(true)
    try {
      await Promise.all([
        window.api.refreshSetSymbols().then((version) => {
          injectKeyruneCSS()
          setKeyruneVersion({ downloaded: version })
        }),
        window.api.refreshSets().then(() => {
          const now = new Date().toISOString()
          window.api.settingsSet('setsLastRefreshed', now)
          setSetsLastRefreshed(now)
        }),
        window.api.refreshCards().then(() => {
          const now = new Date().toISOString()
          window.api.settingsSet('cardsLastRefreshed', now)
          setCardsLastRefreshed(now)
        }),
      ])
    } finally {
      setRefreshAllPending(false)
    }
  }

  const handleRefreshCards = async () => {
    setRefreshCardsPending(true)
    try {
      await window.api.refreshCards()
      const now = new Date().toISOString()
      window.api.settingsSet('cardsLastRefreshed', now)
      setCardsLastRefreshed(now)
    } finally {
      setRefreshCardsPending(false)
    }
  }

  const handleRefreshSets = async () => {
    setRefreshSetsPending(true)
    try {
      await window.api.refreshSets()
      const now = new Date().toISOString()
      window.api.settingsSet('setsLastRefreshed', now)
      setSetsLastRefreshed(now)
    } finally {
      setRefreshSetsPending(false)
    }
  }

  const handleRefreshManaSymbols = async () => {
    setRefreshManaSymbolsPending(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
    } finally {
      setRefreshManaSymbolsPending(false)
    }
  }

  const handleRefreshSetSymbols = async () => {
    setRefreshSetSymbolsPending(true)
    try {
      const version = await window.api.refreshSetSymbols()
      injectKeyruneCSS()
      setKeyruneVersion({ downloaded: version })
    } finally {
      setRefreshSetSymbolsPending(false)
    }
  }

  const keyruneDescription = (
    <>
      {keyruneVersion?.downloaded ? `Installed version v${keyruneVersion.downloaded}` : 'Not installed'}
      {' · '}
      <a
        href="https://keyrune.andrewgioia.com/"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        keyrune.andrewgioia.com
      </a>
    </>
  )

  return (
    <>
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Application settings and preferences.</p>
      </div>

      <Separator />

      <SettingsSection
        title="Appearance"
        description="Customize the look and feel of the application."
      >
        <SettingsRow label="Theme" description="Switch between light and dark mode.">
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                theme === 'light'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                theme === 'dark'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Dark
            </button>
          </div>
        </SettingsRow>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Diagnostics"
        description="Paths and system information for troubleshooting."
      >
        <SettingsRow label="Log files" description="Location of the app logs.">
          <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded select-all">
            {logPath || '—'}
          </code>
        </SettingsRow>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Update data"
        description="Refresh the application data. These actions may take a while"
      >
        <SettingsRow
          label="Refresh All"
          description="Re-download all card data and set information from Scryfall, mana and set symbols."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isAnyRefreshPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshAllPending ? 'animate-spin' : ''}`} />
            {refreshAllPending ? 'Refreshing…' : 'Refresh All'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Cards"
          description={cardsLastRefreshed
            ? `Last refreshed ${new Date(cardsLastRefreshed).toLocaleString()}`
            : 'Update card catalog from Scryfall.'}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCards}
            disabled={isAnyRefreshPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshCardsPending ? 'animate-spin' : ''}`} />
            {refreshCardsPending ? 'Refreshing…' : 'Refresh Cards'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Sets"
          description={setsLastRefreshed
            ? `Last refreshed ${new Date(setsLastRefreshed).toLocaleString()}`
            : 'Update the list of Magic sets and their metadata.'}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSets}
            disabled={isAnyRefreshPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshSetsPending ? 'animate-spin' : ''}`} />
            {refreshSetsPending ? 'Refreshing…' : 'Refresh Sets'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Mana Symbols"
          description="Update the mana symbol images from Scryfall."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshManaSymbols}
            disabled={isAnyRefreshPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshManaSymbolsPending ? 'animate-spin' : ''}`} />
            {refreshManaSymbolsPending ? 'Refreshing…' : 'Refresh Mana Symbols'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Set Symbols"
          description={keyruneDescription}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSetSymbols}
            disabled={isAnyRefreshPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshSetSymbolsPending ? 'animate-spin' : ''}`} />
            {refreshSetSymbolsPending ? 'Refreshing…' : 'Refresh Set Symbols'}
          </Button>
        </SettingsRow>
      </SettingsSection>
    </div>

    <RefreshLoadingDialog open={isAnyRefreshPending} />
    </>
  )
}
