import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import Layout from '@/components/Layout'
import CollectionPage from '@/pages/CollectionPage'
import AddCardPage from '@/pages/AddCardPage'
import CardDetailPage from '@/pages/CardDetailPage'
import DashboardPage from '@/pages/DashboardPage'
import DuplicatesPage from '@/pages/DuplicatesPage'
import SettingsPage from '@/pages/SettingsPage'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/statistics" replace />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/add-card" element={<AddCardPage />} />
            <Route
              path="/card-detail/:setCode/:collectorNumber"
              element={<CardDetailPage />}
            />
            <Route path="/statistics" element={<DashboardPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App