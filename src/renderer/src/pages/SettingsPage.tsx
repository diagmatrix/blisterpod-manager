import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CollectionImport } from '@/components/CollectionImport'
import { CollectionExport } from '@/components/CollectionExport'
import { useTheme } from '@/components/ThemeProvider'
import { RefreshLoadingDialog } from '@/components/RefreshLoadingDialog'
import { injectKeyruneCSS } from '@/lib/keyruneCSS'
import { applyCCMGFont } from '@/lib/ccmgFont'
import type { KeyruneVersion } from '../../../shared/app'

/**
 * Settings Section component for grouping related settings together with a title and optional description.
 */
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

/**
 * Settings Row component for individual settings within a section.
 */
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
  const [manaSymbolsLastRefreshed, setManaSymbolsLastRefreshed] = useState<string | null>(null)
  const [font, setFont] = useState<'default' | 'ccmg'>('default')
  const [ccmgDownloaded, setCcmgDownloaded] = useState(false)
  const [downloadingFont, setDownloadingFont] = useState(false)

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
    window.api.settingsGet('manaSymbolsLastRefreshed').then((v) => setManaSymbolsLastRefreshed(v ?? null))
    window.api.settingsGet('font').then((v) => setFont(v ?? 'default'))
    window.api.ccmgFontStatus().then((s) => setCcmgDownloaded(s.downloaded))
  }, [])

  const handleSetFont = async (value: 'default' | 'ccmg') => {
    if (value === 'ccmg' && !ccmgDownloaded) {
      setDownloadingFont(true)
      try {
        await window.api.downloadCCMGFont()
        setCcmgDownloaded(true)
      } finally {
        setDownloadingFont(false)
      }
    }
    setFont(value)
    window.api.settingsSet('font', value)
    applyCCMGFont(value === 'ccmg')
  }

  const handleRefreshAll = async () => {
    setRefreshAllPending(true)
    try {
      await Promise.all([
        handleRefreshCards(),
        handleRefreshSets(),
        handleRefreshManaSymbols(),
        handleRefreshSetSymbols(),
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
      await window.api.refreshManaSymbols()
      const now = new Date().toISOString()
      window.api.settingsSet('manaSymbolsLastRefreshed', now)
      setManaSymbolsLastRefreshed(now)
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

  const fontDescription = (
    <>
      Switch between the default and CCMG font
      {' · '}
      <a
        href="https://github.com/diagmatrix/CCMG"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        github.com/diagmatrix/CCMG
      </a>
    </>
  )

  return (
    <>
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Application settings and preferences.</p>
      </div>
      <Separator />

      <div className="flex gap-12 items-start">
        {/* Left column */}
        <div className="flex-1 space-y-8">
          {/* Appearance settings */}
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

            <SettingsRow label="Font" description={fontDescription}>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  onClick={() => handleSetFont('default')}
                  disabled={downloadingFont}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    font === 'default'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => handleSetFont('ccmg')}
                  disabled={downloadingFont}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    font === 'ccmg'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {downloadingFont ? 'Downloading…' : 'CCMG'}
                </button>
              </div>
            </SettingsRow>
          </SettingsSection>
          <Separator />

          {/* Diagnostics and troubleshooting */}
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

          {/* Data refresh actions */}
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
              description={manaSymbolsLastRefreshed
                ? `Last refreshed ${new Date(manaSymbolsLastRefreshed).toLocaleString()}`
                : 'Update the mana symbol images from Scryfall.'}
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

        <div className="w-px bg-border self-stretch" />

        {/* Right column */}
        <div className="flex-1 space-y-8">
          {/* Import/export */}
          <SettingsSection
            title="Import/Export"
            description="Import and export your collection data."
          >
            <SettingsRow
              label="Import collection"
              description="Import collection data from a CSV file."
            >
              <CollectionImport />
            </SettingsRow>
            <SettingsRow
              label="Export collection"
              description="Export your collection data to a CSV file."
            >
              <CollectionExport />
            </SettingsRow>
          </SettingsSection>
        </div>
      </div>
    </div>

    <RefreshLoadingDialog open={isAnyRefreshPending} />
    </>
  )
}
