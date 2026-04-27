import { useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator'

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  )
}

export default function AboutPage() {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    window.api.appVersion().then(setVersion)
  }, [])

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Blisterpod Manager {version && `v${version}`}
        </h1>
      </div>

      <Separator />

      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Portions of Blisterpod Manager are unofficial Fan Content permitted under the Wizards of
          the Coast Fan Content Policy. The literal and graphical information presented on this site
          about Magic: The Gathering, including card images and mana symbols, is copyright Wizards
          of the Coast, LLC. Blisterpod Manager is not produced by or endorsed by Wizards of the
          Coast.
        </p>

        <p>
          Magic: The Gathering card data and images, as well as the mana symbol images, belong to{' '}
          <ExternalLink href="https://scryfall.com/">Scryfall, LLC</ExternalLink>. Blisterpod
          Manager is not produced by or endorsed by Scryfall.
        </p>

        <p>
          Set symbols are provided by{' '}
          <ExternalLink href="https://keyrune.andrewgioia.com/">Keyrune</ExternalLink>. CCMG font is
          provided by{' '}
          <ExternalLink href="https://github.com/diagmatrix/CCMG">diagmatrix</ExternalLink>.
        </p>

        <p>
          Blisterpod Manager is licensed under{' '}
          <ExternalLink href="https://opensource.org/license/agpl-3-0">AGPL-3.0</ExternalLink> and
          was made by{' '}
          <ExternalLink href="https://github.com/diagmatrix">diagmatrix</ExternalLink>.
        </p>
      </div>

      <Separator />

      <a
        href="https://github.com/diagmatrix/blisterpod-manager"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="View on GitHub"
      >
        <GitHubIcon className="h-5 w-5" />
        <span>diagmatrix/blisterpod-manager</span>
      </a>
    </div>
  )
}
