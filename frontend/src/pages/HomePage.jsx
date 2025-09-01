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
import { storyAPI } from '../services/api'
import StoryCard from '../components/common/StoryCard'
import EnhancedStoryCard from '../components/common/EnhancedStoryCard'
import AnimatedButton from '../components/common/AnimatedButton'
import { StoryCardSkeleton, CustomSpinner } from '../components/common/LoadingStates'
import ProgressiveLoader, { StaggeredLoader } from '../components/animations/ProgressiveLoader'

const HomePage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true)
        const response = await storyAPI.getAll(1, 3) // Show only 3 latest stories
        setStories(response.data.stories)
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
          </VStack>
        </ProgressiveLoader>

        {/* Impact Metrics - Minimal */}
        <ProgressiveLoader delay={300} type="fade">
          <HStack 
            spacing={8} 
            justify="center" 
            flexWrap="wrap"
            py={6}
            opacity={0.7}
          >
            <Stat textAlign="center" minW="auto">
              <StatNumber fontSize="2xl" color="accent.500" fontWeight="bold">250+</StatNumber>
              <StatLabel fontSize="sm" color="primary.600">Paylaşılan Hikâye</StatLabel>
            </Stat>
            <Stat textAlign="center" minW="auto">
              <StatNumber fontSize="2xl" color="accent.500" fontWeight="bold">1,200+</StatNumber>
              <StatLabel fontSize="sm" color="primary.600">Destekleyen Kadın</StatLabel>
            </Stat>
            <Stat textAlign="center" minW="auto">
              <StatNumber fontSize="2xl" color="accent.500" fontWeight="bold">%95</StatNumber>
              <StatLabel fontSize="sm" color="primary.600">Güvenlik Memnuniyeti</StatLabel>
            </Stat>
          </HStack>
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

      </VStack>
    </Container>
  )
}

export default HomePage