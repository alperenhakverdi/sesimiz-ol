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
import MessagesPage from './pages/MessagesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminStoriesPage from './pages/AdminStoriesPage'
import AdminOrganizationsPage from './pages/AdminOrganizationsPage'
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminFeatureFlagsPage from './pages/AdminFeatureFlagsPage'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
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
              <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/ayarlar" element={<SettingsPage />} />
              <Route path="/mesajlar" element={<MessagesPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stories"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminStoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminOrganizationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminAnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/feature-flags"
                element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminFeatureFlagsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
