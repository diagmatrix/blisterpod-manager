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

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/collection" replace />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/add-card" element={<AddCardPage />} />
            <Route
              path="/card-detail/:setCode/:collectorNumber"
              element={<CardDetailPage />}
            />
            <Route path="/card-detail/:id" element={<CardDetailPage />} />
            <Route path="/statistics" element={<DashboardPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App