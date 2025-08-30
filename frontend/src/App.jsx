import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import StoryDetailPage from './pages/StoryDetailPage'
import StoryCreatePage from './pages/StoryCreatePage'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Header />
      <Box flex="1" as="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hikayeler/:id" element={<StoryDetailPage />} />
          <Route path="/hikaye-olustur" element={<StoryCreatePage />} />
          <Route path="/profil/:id" element={<ProfilePage />} />
          <Route path="/hakkinda" element={<AboutPage />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  )
}

export default App
