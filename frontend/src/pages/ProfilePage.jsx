import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  HStack,
  Avatar,
  SimpleGrid,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Button,
  Badge
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon, AddIcon } from '@chakra-ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { userAPI } from '../services/api'
import StoryCard from '../components/common/StoryCard'

const ProfilePage = () => {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const [userResponse, storiesResponse] = await Promise.all([
          userAPI.getProfile(id),
          userAPI.getStories(id)
        ])
        
        setUser(userResponse.data)
        setStories(storiesResponse.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchUserData()
    }
  }, [id])

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Kullanıcı bulunamadı
        </Alert>
      </Container>
    )
  }

  const memberSince = formatDistanceToNow(new Date(user.createdAt), { 
    addSuffix: true, 
    locale: tr 
  })

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Back Button */}
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            colorScheme="brand"
            as={RouterLink}
            to="/"
            size="sm"
          >
            Ana Sayfaya Dön
          </Button>
        </Box>

        {/* User Profile Header */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <VStack spacing={6}>
            <VStack spacing={4} textAlign="center">
              <Avatar 
                size="2xl" 
                name={user.nickname}
                src={user.avatar}
                bg="brand.100"
                color="brand.500"
              />
              
              <VStack spacing={2}>
                <Heading as="h1" size="xl" color="brand.500">
                  @{user.nickname}
                </Heading>
                <HStack spacing={4} justify="center" flexWrap="wrap">
                  <Badge colorScheme="brand" px={3} py={1}>
                    {user._count.stories} Hikâye
                  </Badge>
                  <Badge colorScheme="gray" px={3} py={1}>
                    Üye {memberSince}
                  </Badge>
                </HStack>
              </VStack>
            </VStack>
          </VStack>
        </Box>

        {/* User Stories */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading as="h2" size="lg" color="gray.700">
              {user.nickname}'in Hikâyeleri
            </Heading>
            <Button 
              colorScheme="brand" 
              leftIcon={<AddIcon />}
              as={RouterLink}
              to="/hikaye-olustur"
              size="sm"
            >
              Yeni Hikâye
            </Button>
          </HStack>

          {stories.length === 0 ? (
            <Box textAlign="center" py={12}>
              <VStack spacing={4}>
                <Text color="gray.500" fontSize="lg">
                  Henüz hikâye paylaşılmamış.
                </Text>
                <Button 
                  colorScheme="brand" 
                  variant="outline"
                  as={RouterLink}
                  to="/hikaye-olustur"
                >
                  İlk hikâyeni paylaş
                </Button>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid 
              columns={{ base: 1, md: 2, lg: 3 }} 
              spacing={6}
            >
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </SimpleGrid>
          )}
        </VStack>

        {/* Profile Stats */}
        <Box bg="gray.50" p={6} borderRadius="lg">
          <VStack spacing={4}>
            <Heading as="h3" size="md" color="gray.700" textAlign="center">
              Profil İstatistikleri
            </Heading>
            <HStack spacing={8} justify="center" flexWrap="wrap">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                  {user._count.stories}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Toplam Hikâye
                </Text>
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="accent.500">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Katılım Tarihi
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>

        {/* Privacy Notice */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="bold" fontSize="sm">
              Gizlilik Hatırlatması
            </Text>
            <Text fontSize="sm">
              Bu profil tamamen anonimdir. Gerçek kimlik bilgileri hiçbir şekilde paylaşılmaz.
            </Text>
          </VStack>
        </Alert>
      </VStack>
    </Container>
  )
}

export default ProfilePage