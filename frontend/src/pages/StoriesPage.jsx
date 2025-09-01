import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Box,
  Spinner,
  Alert,
  AlertIcon,
  HStack
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { storyAPI } from '../services/api'
import EnhancedStoryCard from '../components/common/EnhancedStoryCard'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const StoriesPage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async (page = 1) => {
    try {
      setLoading(true)
      const response = await storyAPI.getAll(page, 12)
      setStories(response.data.stories)
      setPagination(response.data.pagination)
      setError(null)
    } catch (err) {
      setError('Hikâyeler yüklenirken bir hata oluştu.')
      console.error('Error fetching stories:', err)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" color="accent.500" />
          <Text>Hikâyeler yükleniyor...</Text>
        </VStack>
      </Container>
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

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={4} textAlign="center">
          <Heading as="h1" size="xl" color="accent.500">
            Tüm Hikâyeler
          </Heading>
          <Text fontSize="lg" color="primary.600">
            Kadınların cesurca paylaştığı deneyimler
          </Text>
          </VStack>
        </ProgressiveLoader>

        {/* Stories Grid */}
        <ProgressiveLoader delay={400} type="fade">
          {stories.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Henüz hikâye yok</Text>
              <Text>Sen ilk hikâyeyi paylaşmaya ne dersin?</Text>
            </VStack>
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {stories.map((story) => (
              <EnhancedStoryCard key={story.id} story={story} />
            ))}
          </SimpleGrid>
          )}
        </ProgressiveLoader>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <ProgressiveLoader delay={600} type="fade">
          <HStack justify="center" spacing={4}>
            <Button 
              isDisabled={!pagination.hasPrev}
              onClick={() => fetchStories(pagination.page - 1)}
            >
              Önceki
            </Button>
            <Text>
              Sayfa {pagination.page} / {pagination.totalPages}
            </Text>
            <Button 
              isDisabled={!pagination.hasNext}
              onClick={() => fetchStories(pagination.page + 1)}
            >
              Sonraki
            </Button>
            </HStack>
          </ProgressiveLoader>
        )}
      </VStack>
    </Container>
  )
}

export default StoriesPage