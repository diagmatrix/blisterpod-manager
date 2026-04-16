import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Load initial theme from persistence
  useEffect(() => {
    window.api.settingsGet('theme').then((savedTheme) => {
      if (savedTheme) {
        setThemeState(savedTheme)
        updateDocument(savedTheme)
      } else {
        updateDocument(defaultTheme)
      }
    })
  }, [defaultTheme])

  const updateDocument = (newTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
  }

  const setTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    
    // Add temporary transition class
    root.classList.add('theme-transitioning')
    
    setThemeState(newTheme)
    updateDocument(newTheme)
    window.api.settingsSet('theme', newTheme)

    // Remove transition class after animation finishes
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
