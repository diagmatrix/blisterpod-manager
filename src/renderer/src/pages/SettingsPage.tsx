import { useEffect, useState } from 'react'
import { RefreshCw, Database, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/ThemeProvider'

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
  description?: string
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
  const [refreshAllPending, setRefreshAllPending] = useState(false)
  const [refreshCardsPending, setRefreshCardsPending] = useState(false)
  const [refreshSetsPending, setRefreshSetsPending] = useState(false)
  const [refreshManaSymbols, setRefreshManaSymbols] = useState(false)
  const [refreshSetSymbols, setRefreshSetSymbols] = useState(false)


  useEffect(() => {
    window.api.logPath().then(setLogPath)
  }, [])

  // Placeholder handlers — will be wired to Scryfall API in a future ticket
  const handleRefreshAll = async () => {
    setRefreshAllPending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshAllPending(false)
  }

  const handleRefreshCards = async () => {
    setRefreshCardsPending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshCardsPending(false)
  }

  const handleRefreshSets = async () => {
    setRefreshSetsPending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshSetsPending(false)
  }

  const handleRefreshManaSymbols = async () => {
    setRefreshManaSymbols(true)
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshManaSymbols(false)
  }

  const handleRefreshSetSymbols = async () => {
    setRefreshSetSymbols(true)
    await new Promise((r) => setTimeout(r, 1000))
    setRefreshSetSymbols(false)
  }

  return (
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
            disabled={refreshAllPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshAllPending ? 'animate-spin' : ''}`} />
            {refreshAllPending ? 'Refreshing…' : 'Refresh All'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Cards"
          description="Uptade card catalog from Scryfall."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCards}
            disabled={refreshCardsPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshCardsPending ? 'animate-spin' : ''}`} />
            {refreshCardsPending ? 'Refreshing…' : 'Refresh Cards'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Sets"
          description="Update the list of Magic sets and their metadata."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSets}
            disabled={refreshSetsPending}
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
            disabled={refreshManaSymbols}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshManaSymbols ? 'animate-spin' : ''}`} />
            {refreshManaSymbols ? 'Refreshing…' : 'Refresh Symbols'}
          </Button>
        </SettingsRow>

        <SettingsRow
          label="Refresh Set Symbols"
          description="Update the Keyrune set symbols."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSetSymbols}
            disabled={refreshSetSymbols}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshSetSymbols ? 'animate-spin' : ''}`} />
            {refreshSetSymbols ? 'Refreshing…' : 'Refresh Symbols'}
          </Button>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
