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
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon, ViewIcon } from '@chakra-ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { storyAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import CommentSection from '../components/comments/CommentSection'
import SendMessageButton from '../components/story/SendMessageButton'
import StoryLikeButton from '../components/story/StoryLikeButton'
import { ensureAvatar } from '../utils/avatar'

const StoryDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [story, setStory] = useState(null)
  const [likesCount, setLikesCount] = useState(0)
  const [userHasLiked, setUserHasLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Color mode values for mobile reading experience
  const bg = useColorModeValue('white', 'neutral.800')
  const textColor = useColorModeValue('neutral.800', 'neutral.100')
  const metaColor = useColorModeValue('neutral.600', 'neutral.400')
  const borderColor = useColorModeValue('neutral.200', 'neutral.700')
  const authorProfileUrl = story?.author?.id ? `/profil/${story.author.id}` : story?.authorId ? `/profil/${story.authorId}` : null

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
  }, [story])

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true)
        const response = await storyAPI.getById(id)
        console.log('✅ Story loaded:', response.story.title)
        setStory(response.story)
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

  useEffect(() => {
    if (!story) return
    setLikesCount(story.likesCount ?? 0)
    setUserHasLiked(Boolean(story.userHasLiked))
  }, [story])

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
        <Box
          bg={bg}
          p={{ base: 4, md: 8 }}
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="stretch">
            {/* Story Header */}
            <VStack spacing={4} align="start">
              <Heading
                as="h1"
                size={{ base: "lg", md: "xl" }}
                color="accent.500"
                lineHeight="shorter"
                fontWeight="bold"
              >
                {story.title}
              </Heading>
              
              <HStack justify="space-between" w="full" align="center" flexWrap={{ base: "wrap", md: "nowrap" }} gap={4}>
                <HStack
                  spacing={3}
                  as={authorProfileUrl ? RouterLink : 'div'}
                  to={authorProfileUrl || undefined}
                  onClick={authorProfileUrl ? (event) => event.stopPropagation() : undefined}
                  _hover={authorProfileUrl ? { textDecoration: 'none' } : undefined}
                >
                  <Avatar
                    size="md"
                    name={story.authorNickname || story.author?.nickname}
                    src={ensureAvatar(story.authorAvatar || story.author?.avatar, story.authorNickname || story.author?.nickname)}
                    bg="brand.100"
                    color="brand.500"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" color={textColor} _hover={authorProfileUrl ? { color: 'accent.500' } : undefined}>
                      @{story.authorNickname || story.author?.nickname}
                    </Text>
                    <Text fontSize="sm" color={metaColor}>
                      {timeAgo}
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} align="center">
                  <StoryLikeButton
                    storyId={story.id}
                    initialLiked={userHasLiked}
                    initialCount={likesCount}
                    onChange={({ liked, likesCount: updatedCount }) => {
                      setUserHasLiked(liked)
                      if (typeof updatedCount === 'number') {
                        setLikesCount(updatedCount)
                      }
                    }}
                  />
                  <HStack spacing={1} color={metaColor} fontSize="sm">
                    <ViewIcon />
                    <Text>{story.viewCount ?? 0} görüntüleme</Text>
                  </HStack>
                  <SendMessageButton
                    storyAuthor={{
                      id: story.authorId || story.author?.id,
                      nickname: story.authorNickname || story.author?.nickname,
                      avatar: story.authorAvatar || story.author?.avatar
                    }}
                    storyTitle={story.title}
                  />
                  <Badge
                    colorScheme="accent"
                    variant="subtle"
                    px={3}
                    py={1}
                  >
                    Hikâye
                  </Badge>
                </HStack>
              </HStack>
            </VStack>

            <Divider borderColor={borderColor} />

            {/* Story Content */}
            <Box py={2}>
              <Text
                fontSize={{ base: "md", md: "lg" }}
                lineHeight={{ base: "1.6", md: "1.8" }}
                color={textColor}
                whiteSpace="pre-wrap"
                letterSpacing="0.02em"
                wordBreak="break-word"
              >
                {story.content}
              </Text>
            </Box>

            <Divider borderColor={borderColor} />

            {/* Story Footer */}
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color={metaColor}>
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
                  } catch {
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
                      } catch {
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
            currentUserNickname={user?.nickname}
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
