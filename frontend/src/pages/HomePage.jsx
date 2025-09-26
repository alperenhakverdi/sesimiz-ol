import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  HStack,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AddIcon } from '@chakra-ui/icons'
import { storyAPI, api } from '../services/api'
import StoryCard from '../components/common/StoryCard'
import EnhancedStoryCard from '../components/common/EnhancedStoryCard'
import AnimatedButton from '../components/common/AnimatedButton'
import { StoryCardSkeleton, CustomSpinner } from '../components/common/LoadingStates'
import ProgressiveLoader, { StaggeredLoader } from '../components/animations/ProgressiveLoader'
import AnnouncementBanner from '../components/announcements/AnnouncementBanner'
import OrganizationCard from '../components/organizations/OrganizationCard'
import UserCard from '../components/community/UserCard'

const HomePage = () => {
  const [stories, setStories] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [activeUsers, setActiveUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Mock data for MVP
  const mockOrganizations = [
    {
      id: 1,
      name: 'Kadın Dayanışma Vakfı',
      slug: 'kadin-dayanisma-vakfi',
      type: 'FOUNDATION',
      status: 'ACTIVE',
      description: 'Kadınların toplumsal hayatta eşit katılımını destekleyen vakıf.',
      location: 'İstanbul',
      memberCount: 2500
    },
    {
      id: 2,
      name: 'Çevre Koruma Derneği',
      slug: 'cevre-koruma-dernegi',
      type: 'ASSOCIATION',
      status: 'ACTIVE',
      description: 'Doğal yaşamı koruma ve çevre bilincini artırma derneği.',
      location: 'Ankara',
      memberCount: 1800
    },
    {
      id: 3,
      name: 'Eğitim Gönüllüleri STK',
      slug: 'egitim-gonulluleri-stk',
      type: 'NGO',
      status: 'ACTIVE',
      description: 'Eğitim fırsatlarını eşitleme amacıyla kurulan STK.',
      location: 'İzmir',
      memberCount: 950
    }
  ]

  const mockActiveUsers = [
    {
      id: 1,
      nickname: 'ayse_kadin_hakları',
      name: 'Ayşe Demir',
      role: 'ORGANIZATION',
      storyCount: 23,
      commentCount: 156,
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      nickname: 'mehmet_cevre',
      name: 'Mehmet Özkan',
      role: 'USER',
      storyCount: 45,
      commentCount: 289,
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      nickname: 'zeynep_egitim',
      name: 'Zeynep Yılmaz',
      role: 'USER',
      storyCount: 12,
      commentCount: 67,
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('🔄 Fetching data from API...')
        
        // Fetch stories
        const response = await storyAPI.getAll(1, 3) // Show only 3 latest stories
        console.log('✅ API Response:', response)
        console.log('📚 Stories data:', response.stories)
        setStories(response.stories)
        
        // Fetch organizations, users and stats from API
        try {
          const [orgsResponse, usersResponse, orgStatsResponse, communityStatsResponse] = await Promise.all([
            api.get('/organizations', { params: { limit: 3 } }),
            api.get('/community/users', { params: { limit: 3 } }),
            api.get('/organizations/stats'),
            api.get('/community/stats')
          ])
          
          setOrganizations(orgsResponse.data?.organizations || [])
          setActiveUsers(usersResponse.data?.users || [])

          // Update stats for display
          setStats({
            totalStories: communityStatsResponse.data?.totalStories || 0,
            totalUsers: communityStatsResponse.data?.totalUsers || 0,
            totalOrganizations: orgStatsResponse.data?.totalOrganizations || 0,
            satisfaction: 95 // Mock satisfaction rate
          })
        } catch (err) {
          console.error('Homepage data fetch error:', err)
          // Fallback to mock data if API fails
          setOrganizations(mockOrganizations)
          setActiveUsers(mockActiveUsers)
        }
      } catch (err) {
        console.error('❌ API Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={12}>
          {/* Hero Section Skeleton */}
          <VStack spacing={6} textAlign="center" py={8}>
            <Heading 
              as="h1" 
              size="2xl" 
              color="brand.500"
              fontWeight="bold"
            >
              Sesimiz Ol
            </Heading>
            <Text 
              fontSize="xl" 
              color="neutral.600" 
              maxW="2xl"
              lineHeight="tall"
            >
              Kadınların hikâyelerini güvenle paylaşabilecekleri anonim platform. 
              Sesimiz birleşsin, hikâyelerimiz duyulsun.
            </Text>
            <AnimatedButton
              colorScheme="brand" 
              size="lg"
              leftIcon={<AddIcon />}
              as={RouterLink}
              to="/hikaye-olustur"
              px={8}
              py={6}
              fontSize="lg"
              animation="pulse"
            >
              Hikâyeni Paylaş
            </AnimatedButton>
          </VStack>

          {/* Loading Stories */}
          <Box w="full">
            <VStack spacing={8} align="stretch">
              <Heading as="h2" size="lg" textAlign="center" color="neutral.800">
                Son Hikâyeler
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                <StoryCardSkeleton count={6} />
              </SimpleGrid>
            </VStack>
          </Box>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={12}>
        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Hero Section */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={8} textAlign="center" py={8}>
            <Heading 
              as="h1" 
              size="2xl" 
              color="accent.500"
              fontWeight="bold"
            >
              Sesimiz Ol
            </Heading>
            <Text 
              fontSize="xl" 
              color="primary.600" 
              maxW="2xl"
              lineHeight="tall"
            >
              Kadınların hikâyelerini güvenle paylaşabilecekleri anonim platform. 
              Sesimiz birleşsin, hikâyelerimiz duyulsun.
            </Text>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <AnimatedButton 
                colorScheme="accent" 
                size="lg"
                leftIcon={<AddIcon />}
                as={RouterLink}
                to="/hikaye-olustur"
                px={8}
                py={6}
                fontSize="lg"
                animation="bounce"
              >
                Hikâyeni Paylaş
              </AnimatedButton>
              <Button 
                as={RouterLink}
                to="/topluluk"
                variant="outline"
                colorScheme="accent"
                size="lg"
                px={8}
                py={6}
                fontSize="lg"
              >
                Topluluğa Katıl
              </Button>
            </HStack>
          </VStack>
        </ProgressiveLoader>

        {/* Impact Metrics - Enhanced */}
        <ProgressiveLoader delay={300} type="fade">
          <SimpleGrid 
            columns={{ base: 2, md: 4 }} 
            spacing={8}
            w="full"
            maxW="4xl"
            mx="auto"
          >
                 <Stat textAlign="center" bg="white" p={6} borderRadius="lg" shadow="sm">
                   <StatNumber fontSize="3xl" color="accent.500" fontWeight="bold">{stats.totalStories || 250}+</StatNumber>
                   <StatLabel fontSize="sm" color="primary.600">Paylaşılan Hikâye</StatLabel>
                 </Stat>
                 <Stat textAlign="center" bg="white" p={6} borderRadius="lg" shadow="sm">
                   <StatNumber fontSize="3xl" color="accent.500" fontWeight="bold">{stats.totalUsers || 1200}+</StatNumber>
                   <StatLabel fontSize="sm" color="primary.600">Topluluk Üyesi</StatLabel>
                 </Stat>
                 <Stat textAlign="center" bg="white" p={6} borderRadius="lg" shadow="sm">
                   <StatNumber fontSize="3xl" color="accent.500" fontWeight="bold">{stats.totalOrganizations || 45}+</StatNumber>
                   <StatLabel fontSize="sm" color="primary.600">Aktif STK</StatLabel>
                 </Stat>
                 <Stat textAlign="center" bg="white" p={6} borderRadius="lg" shadow="sm">
                   <StatNumber fontSize="3xl" color="accent.500" fontWeight="bold">%{stats.satisfaction || 95}</StatNumber>
                   <StatLabel fontSize="sm" color="primary.600">Memnuniyet</StatLabel>
                 </Stat>
          </SimpleGrid>
        </ProgressiveLoader>

        {/* Stories Section */}
        <ProgressiveLoader delay={400} type="fade">
          <Box w="full">
            <VStack spacing={8} align="stretch">
              <Heading as="h2" size="lg" textAlign="center" color="primary.800">
                Son Hikâyeler
              </Heading>
              
              {error ? (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              ) : stories.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Text color="primary.500" fontSize="lg">
                    Henüz hikâye paylaşılmamış.
                  </Text>
                  <AnimatedButton 
                    colorScheme="accent" 
                    variant="outline"
                    mt={4}
                    as={RouterLink}
                    to="/hikaye-olustur"
                    animation="glow"
                  >
                    İlk hikâyeyi sen paylaş
                  </AnimatedButton>
                </Box>
              ) : (
                <>
                  <SimpleGrid 
                    columns={{ base: 1, md: 2, lg: 3 }} 
                    spacing={8}
                  >
                    {stories.map((story, index) => (
                      <ProgressiveLoader key={story.id} delay={600 + (index * 50)} type="fade">
                        <EnhancedStoryCard story={story} />
                      </ProgressiveLoader>
                    ))}
                  </SimpleGrid>

                  {/* View More Stories Link */}
                  {stories.length === 3 && (
                    <ProgressiveLoader delay={900} type="fade">
                      <Box textAlign="center" pt={8}>
                        <Text color="primary.600" fontSize="sm" mb={4}>
                          Son {stories.length} hikâye gösteriliyor
                        </Text>
                        <Button 
                          as={RouterLink}
                          to="/hikayeler"
                          variant="outline" 
                          colorScheme="accent"
                          size="md"
                        >
                          Tüm Hikâyeleri Gör
                        </Button>
                      </Box>
                    </ProgressiveLoader>
                  )}
                </>
              )}
            </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Featured Organizations Section */}
        <ProgressiveLoader delay={1000} type="fade">
          <Box w="full">
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading as="h2" size="lg" color="primary.800">
                  Öne Çıkan STK'lar
                </Heading>
                <Button 
                  as={RouterLink}
                  to="/stklar"
                  variant="ghost" 
                  colorScheme="accent"
                  size="sm"
                >
                  Tümünü Gör →
                </Button>
              </HStack>
              
              <Box overflowX="auto" pb={4}>
                <HStack spacing={6} align="stretch" minW="max-content">
                  {organizations.map((org) => (
                    <Box key={org.id} minW="300px" maxW="300px">
                      <OrganizationCard organization={org} />
                    </Box>
                  ))}
                </HStack>
              </Box>
            </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Active Community Section */}
        <ProgressiveLoader delay={1100} type="fade">
          <Box w="full">
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading as="h2" size="lg" color="primary.800">
                  Aktif Topluluk Üyeleri
                </Heading>
                <Button 
                  as={RouterLink}
                  to="/topluluk"
                  variant="ghost" 
                  colorScheme="accent"
                  size="sm"
                >
                  Tümünü Gör →
                </Button>
              </HStack>
              
              <Box overflowX="auto" pb={4}>
                <HStack spacing={6} align="stretch" minW="max-content">
                  {activeUsers.map((user) => (
                    <Box key={user.id} minW="280px" maxW="280px">
                      <UserCard user={user} showActions={false} />
                    </Box>
                  ))}
                </HStack>
              </Box>
            </VStack>
          </Box>
        </ProgressiveLoader>

      </VStack>
    </Container>
  )
}

export default HomePage