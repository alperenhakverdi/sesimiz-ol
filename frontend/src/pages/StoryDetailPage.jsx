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
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Button
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { storyAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import CommentSection from '../components/comments/CommentSection'

const StoryDetailPage = () => {
  const { id } = useParams()
  const { getCurrentNickname } = useAuth()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true)
        const response = await storyAPI.getById(id)
        setStory(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchStory()
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

  if (!story) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Hikâye bulunamadı
        </Alert>
      </Container>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(story.createdAt), { 
    addSuffix: true, 
    locale: tr 
  })

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Back Button */}
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            colorScheme="accent"
            as={RouterLink}
            to="/"
            size="sm"
          >
            Hikâyelere Dön
          </Button>
        </Box>

        {/* Story Content */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <VStack spacing={6} align="stretch">
            {/* Story Header */}
            <VStack spacing={4} align="start">
              <Heading as="h1" size="xl" color="brand.500">
                {story.title}
              </Heading>
              
              <HStack justify="space-between" w="full" align="center">
                <HStack spacing={3}>
                  <Avatar 
                    size="md" 
                    name={story.author.nickname}
                    src={story.author.avatar}
                    bg="brand.100"
                    color="brand.500"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" color="neutral.700">
                      @{story.author.nickname}
                    </Text>
                    <Text fontSize="sm" color="neutral.500">
                      {timeAgo}
                    </Text>
                  </VStack>
                </HStack>
                
                <Badge 
                  colorScheme="accent" 
                  variant="subtle"
                  px={3}
                  py={1}
                >
                  Hikâye
                </Badge>
              </HStack>
            </VStack>

            <Divider />

            {/* Story Content */}
            <Box>
              <Text 
                fontSize="lg"
                lineHeight="tall"
                color="neutral.700"
                whiteSpace="pre-wrap"
              >
                {story.content}
              </Text>
            </Box>

            <Divider />

            {/* Story Footer */}
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color="neutral.500">
                Paylaşım tarihi: {new Date(story.createdAt).toLocaleDateString('tr-TR')}
                {story.updatedAt !== story.createdAt && (
                  <Text as="span" ml={2}>
                    (Düzenlendi: {new Date(story.updatedAt).toLocaleDateString('tr-TR')})
                  </Text>
                )}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Comments Section */}
        <Box bg="neutral.50" p={6} borderRadius="lg">
          <CommentSection 
            storyId={id}
            currentUserNickname={getCurrentNickname()}
          />
        </Box>

        {/* Related Actions */}
        <VStack spacing={4} textAlign="center" py={8}>
          <Text fontSize="lg" color="neutral.600">
            Sen de hikâyeni paylaşmak istiyor musun?
          </Text>
          <Button 
            colorScheme="accent" 
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

export default StoryDetailPage