import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import { SkipToMain } from './components/common/AccessibilityEnhancements'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const StoriesPage = lazy(() => import('./pages/StoriesPage'))
const StoryDetailPage = lazy(() => import('./pages/StoryDetailPage'))
const StoryCreatePage = lazy(() => import('./pages/StoryCreatePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminStoriesPage = lazy(() => import('./pages/AdminStoriesPage'))
const AdminOrganizationsPage = lazy(() => import('./pages/AdminOrganizationsPage'))
const AdminAnnouncementsPage = lazy(() => import('./pages/AdminAnnouncementsPage'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminFeatureFlagsPage = lazy(() => import('./pages/AdminFeatureFlagsPage'))
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage'))
const OrganizationDetailPage = lazy(() => import('./pages/OrganizationDetailPage'))
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'))
const AnnouncementDetailPage = lazy(() => import('./pages/AnnouncementDetailPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))

// Loading component
const PageLoader = () => (
  <Center py={20}>
    <Spinner size="xl" color="accent.500" thickness="4px" />
  </Center>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SkipToMain />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin Routes - No main header */}
            <Route path="/admin/*" element={
              <Routes>
                <Route path="dashboard" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } />
                <Route path="stories" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminStoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="organizations" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminOrganizationsPage />
                  </ProtectedRoute>
                } />
                <Route path="announcements" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminAnnouncementsPage />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="feature-flags" element={
                  <ProtectedRoute requireAdmin={true} redirectToModal={false}>
                    <AdminFeatureFlagsPage />
                  </ProtectedRoute>
                } />
              </Routes>
            } />
            
            {/* Main Site Routes - With main header */}
            <Route path="/*" element={
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
                    <Route path="/stklar" element={<OrganizationsPage />} />
                    <Route path="/stklar/:slug" element={<OrganizationDetailPage />} />
                    <Route path="/duyurular" element={<AnnouncementsPage />} />
                    <Route path="/duyurular/:id" element={<AnnouncementDetailPage />} />
                    <Route path="/topluluk" element={<CommunityPage />} />
                    <Route path="/destek" element={<SupportPage />} />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Box>
                <Footer />
              </Box>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App