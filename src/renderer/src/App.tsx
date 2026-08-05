import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import Layout from '@/components/Layout'
import CollectionPage from '@/pages/CollectionPage'
import AddCardPage from '@/pages/AddCardPage'
import CardDetailPage from '@/pages/CardDetailPage'
import DashboardPage from '@/pages/DashboardPage'
import CollectionErrorsPage from '@/pages/CollectionErrorsPage'
import SettingsPage from '@/pages/SettingsPage'
import AboutPage from '@/pages/AboutPage'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { injectKeyruneCSS } from '@/lib/keyruneCSS'
import { applyCCMGFont } from '@/lib/ccmgFont'
import { FirstRunDialog } from '@/components/FirstRunDialog'
import DecksPage from './pages/DecksPage'
import DeckDetailPage from '@/pages/DeckDetailPage'

function App() {
    const [showFirstRun, setShowFirstRun] = useState(false)

    useEffect(() => {
        window.api.keyruneVersion().then((v) => {
            if (v.downloaded) injectKeyruneCSS()
        })
        window.api.settingsGet('font').then((f) => {
            applyCCMGFont(f === 'ccmg')
        })
        window.api.settingsGet('firstRun').then((v) => {
            if (v !== false) setShowFirstRun(true)
        })
    }, [])

    return (
        <ThemeProvider defaultTheme="light">
            <HashRouter>
                <ScrollToTop />
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/collection" element={<CollectionPage />} />
                        <Route path="/add-card" element={<AddCardPage />} />
                        <Route
                            path="/card-detail/:setCode/:collectorNumber"
                            element={<CardDetailPage />}
                        />
                        <Route path="/home" element={<DashboardPage />} />
                        <Route path="/decks" element={<DecksPage />} />
                        <Route path="/decks/:id" element={<DeckDetailPage />} />
                        <Route path="/collection-errors" element={<CollectionErrorsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/about" element={<AboutPage />} />
                    </Route>
                </Routes>
            </HashRouter>
            <Toaster />
            <FirstRunDialog open={showFirstRun} onClose={() => setShowFirstRun(false)} />
        </ThemeProvider>
    )
}

export default App