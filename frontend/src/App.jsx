import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import StoriesPage from './pages/StoriesPage'
import StoryDetailPage from './pages/StoryDetailPage'
import StoryCreatePage from './pages/StoryCreatePage'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import SupportPage from './pages/SupportPage'
import ContactPage from './pages/ContactPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import ErrorBoundary from './components/common/ErrorBoundary'
import { SkipToMain } from './components/common/AccessibilityEnhancements'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SkipToMain />
        <Box minH="100vh" display="flex" flexDirection="column">
          <Header />
          <Box 
            flex="1" 
            as="main" 
            id="main-content"
            tabIndex="-1"
            outline="none"
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hikayeler" element={<StoriesPage />} />
              <Route path="/hikayeler/:id" element={<StoryDetailPage />} />
              <Route path="/hikaye-olustur" element={<StoryCreatePage />} />
              <Route path="/profil/:id" element={<ProfilePage />} />
              <Route path="/hakkinda" element={<AboutPage />} />
              <Route path="/gizlilik" element={<PrivacyPage />} />
              <Route path="/destek" element={<SupportPage />} />
              <Route path="/iletisim" element={<ContactPage />} />
              <Route path="/kayit-ol" element={<RegisterPage />} />
              <Route path="/ayarlar" element={<SettingsPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
