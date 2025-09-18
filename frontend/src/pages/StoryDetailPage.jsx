import { useState, useEffect, useMemo } from 'react'
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

  // useMemo must be called before any conditional returns
  const timeAgo = useMemo(() => {
    if (!story) return 'Tarih belirtilmemiş'
    
    try {
      // Handle both Firebase timestamp format and ISO string format
      let date
      if (story.createdAt?.seconds) {
        // Firebase timestamp format
        date = new Date(story.createdAt.seconds * 1000)
      } else if (typeof story.createdAt === 'string') {
        // ISO string format from API
        date = new Date(story.createdAt)
      } else if (story.createdAt instanceof Date) {
        // Already a Date object
        date = story.createdAt
      } else {
        return 'Tarih belirtilmemiş'
      }
      
      if (isNaN(date.getTime())) {
        return 'Tarih belirtilmemiş'
      }
      
      return formatDistanceToNow(date, { addSuffix: true, locale: tr })
    } catch (error) {
      console.error('Date parsing error:', error, story.createdAt)
      return 'Tarih belirtilmemiş'
    }
  }, [story, story?.createdAt])

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true)
        const response = await storyAPI.getById(id)
        console.log('✅ Story loaded:', response.data.story.title)
        setStory(response.data.story)
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
                    name={story.authorNickname || story.author?.nickname}
                    src={story.authorAvatar || story.author?.avatar}
                    bg="brand.100"
                    color="brand.500"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" color="neutral.700">
                      @{story.authorNickname || story.author?.nickname}
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
                Paylaşım tarihi: {(() => {
                  try {
                    let date
                    if (story.createdAt?.seconds) {
                      date = new Date(story.createdAt.seconds * 1000)
                    } else if (typeof story.createdAt === 'string') {
                      date = new Date(story.createdAt)
                    } else if (story.createdAt instanceof Date) {
                      date = story.createdAt
                    } else {
                      return 'Tarih belirtilmemiş'
                    }
                    return isNaN(date.getTime()) ? 'Tarih belirtilmemiş' : date.toLocaleDateString('tr-TR')
                  } catch (error) {
                    return 'Tarih belirtilmemiş'
                  }
                })()}
                {story.updatedAt && story.updatedAt !== story.createdAt && (
                  <Text as="span" ml={2}>
                    (Düzenlendi: {(() => {
                      try {
                        let date
                        if (story.updatedAt?.seconds) {
                          date = new Date(story.updatedAt.seconds * 1000)
                        } else if (typeof story.updatedAt === 'string') {
                          date = new Date(story.updatedAt)
                        } else if (story.updatedAt instanceof Date) {
                          date = story.updatedAt
                        } else {
                          return 'Tarih belirtilmemiş'
                        }
                        return isNaN(date.getTime()) ? 'Tarih belirtilmemiş' : date.toLocaleDateString('tr-TR')
                      } catch (error) {
                        return 'Tarih belirtilmemiş'
                      }
                    })()})
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