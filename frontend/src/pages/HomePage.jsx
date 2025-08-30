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
  Center
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AddIcon } from '@chakra-ui/icons'
import { storyAPI } from '../services/api'
import StoryCard from '../components/common/StoryCard'

const HomePage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true)
        const response = await storyAPI.getAll()
        setStories(response.data.stories)
        setPagination(response.data.pagination)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={12}>
        {/* Hero Section */}
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
            color="gray.600" 
            maxW="2xl"
            lineHeight="tall"
          >
            Kadınların hikâyelerini güvenle paylaşabilecekleri anonim platform. 
            Sesimiz birleşsin, hikâyelerimiz duyulsun.
          </Text>
          <Button 
            colorScheme="brand" 
            size="lg"
            leftIcon={<AddIcon />}
            as={RouterLink}
            to="/hikaye-olustur"
            px={8}
            py={6}
            fontSize="lg"
          >
            Hikâyeni Paylaş
          </Button>
        </VStack>

        {/* Stories Section */}
        <Box w="full">
          <VStack spacing={8} align="stretch">
            <Heading as="h2" size="lg" textAlign="center" color="gray.700">
              Son Hikâyeler
            </Heading>
            
            {error ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            ) : stories.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text color="gray.500" fontSize="lg">
                  Henüz hikâye paylaşılmamış.
                </Text>
                <Button 
                  colorScheme="brand" 
                  variant="outline"
                  mt={4}
                  as={RouterLink}
                  to="/hikaye-olustur"
                >
                  İlk hikâyeyi sen paylaş
                </Button>
              </Box>
            ) : (
              <>
                <SimpleGrid 
                  columns={{ base: 1, md: 2, lg: 3 }} 
                  spacing={6}
                >
                  {stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </SimpleGrid>

                {/* Pagination - Simple version */}
                {pagination && pagination.totalPages > 1 && (
                  <Box textAlign="center" pt={8}>
                    <Text color="gray.500" fontSize="sm">
                      Sayfa {pagination.page} / {pagination.totalPages} 
                      ({pagination.total} hikâye)
                    </Text>
                    <Box mt={4}>
                      <Button 
                        variant="outline" 
                        colorScheme="brand"
                        size="sm"
                        mr={2}
                        isDisabled={!pagination.hasPrev}
                      >
                        Önceki
                      </Button>
                      <Button 
                        variant="outline" 
                        colorScheme="brand"
                        size="sm"
                        isDisabled={!pagination.hasNext}
                      >
                        Sonraki
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </VStack>
        </Box>

        {/* Call to Action */}
        <VStack spacing={4} textAlign="center" py={8}>
          <Text fontSize="lg" color="gray.600">
            Sen de hikâyeni paylaşmak istiyor musun?
          </Text>
          <Button 
            colorScheme="accent" 
            variant="outline"
            size="lg"
            as={RouterLink}
            to="/hikaye-olustur"
          >
            Hikâyeni Paylaş
          </Button>
        </VStack>
      </VStack>
    </Container>
  )
}

export default HomePage