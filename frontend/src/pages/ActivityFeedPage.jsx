import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Flex,
  Link,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useColorModeValue
} from '@chakra-ui/react'
import { FiActivity, FiUsers, FiMessageCircle, FiFileText, FiHeart } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { Link as RouterLink } from 'react-router-dom'

const ActivityFeedPage = () => {
  const { token } = useAuth()
  const toast = useToast()

  const [feedActivities, setFeedActivities] = useState([])
  const [myActivities, setMyActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Load activity feed
  const loadFeed = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/activity/feed?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setFeedActivities(data.activities)
        } else {
          setFeedActivities(prev => [...prev, ...data.activities])
        }
        setPagination(data.pagination)
      } else {
        throw new Error(data.error?.message || 'Aktivite akışı yüklenemedi')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  // Load my activities
  const loadMyActivities = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/activity/my-activities?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setMyActivities(data.activities)
        } else {
          setMyActivities(prev => [...prev, ...data.activities])
        }
        setPagination(data.pagination)
      } else {
        throw new Error(data.error?.message || 'Aktiviteleriniz yüklenemedi')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    if (token) {
      if (activeTab === 0) {
        loadFeed(1)
      } else {
        loadMyActivities(1)
      }
    }
  }, [activeTab, token, loadFeed, loadMyActivities])

  const handleTabChange = (index) => {
    setActiveTab(index)
    setPagination({ page: 1, limit: 20, total: 0, pages: 0 })
  }

  const loadMore = () => {
    const nextPage = pagination.page + 1
    if (activeTab === 0) {
      loadFeed(nextPage)
    } else {
      loadMyActivities(nextPage)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_story':
      case 'my_story':
        return <FiFileText color="var(--chakra-colors-blue-500)" />
      case 'new_comment':
      case 'my_comment':
        return <FiMessageCircle color="var(--chakra-colors-green-500)" />
      case 'new_follower':
        return <FiUsers color="var(--chakra-colors-purple-500)" />
      default:
        return <FiActivity color="var(--chakra-colors-gray-500)" />
    }
  }

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'new_story':
        return (
          <Text fontSize="sm" color="neutral.700">
            <Text as="span" fontWeight="medium">@{activity.user.nickname}</Text>
            {' '}yeni bir hikaye paylaştı: {' '}
            <Link
              as={RouterLink}
              to={`/story/${activity.data.story.slug}`}
              color="brand.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              {activity.data.story.title}
            </Link>
          </Text>
        )
      case 'my_story':
        return (
          <Text fontSize="sm" color="neutral.700">
            Yeni hikaye paylaştınız: {' '}
            <Link
              as={RouterLink}
              to={`/story/${activity.data.story.slug}`}
              color="brand.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              {activity.data.story.title}
            </Link>
            <Text as="span" color="neutral.500" ml={2}>
              ({activity.data.story.commentCount} yorum)
            </Text>
          </Text>
        )
      case 'new_comment':
        return (
          <Text fontSize="sm" color="neutral.700">
            <Text as="span" fontWeight="medium">@{activity.user.nickname}</Text>
            {' '}bir hikayeye yorum yaptı: {' '}
            <Link
              as={RouterLink}
              to={`/story/${activity.data.story.slug}`}
              color="brand.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              {activity.data.story.title}
            </Link>
          </Text>
        )
      case 'my_comment':
        return (
          <Text fontSize="sm" color="neutral.700">
            Bir hikayeye yorum yaptınız: {' '}
            <Link
              as={RouterLink}
              to={`/story/${activity.data.story.slug}`}
              color="brand.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              {activity.data.story.title}
            </Link>
          </Text>
        )
      case 'new_follower':
        return (
          <Text fontSize="sm" color="neutral.700">
            <Text as="span" fontWeight="medium">@{activity.user.nickname}</Text>
            {' '}sizi takip etmeye başladı
          </Text>
        )
      default:
        return <Text fontSize="sm" color="neutral.700">Bilinmeyen aktivite</Text>
    }
  }

  const ActivityCard = ({ activity }) => (
    <Box
      p={4}
      bg={useColorModeValue('white','neutral.800')}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="neutral.200"
      _hover={{ borderColor: "neutral.300", shadow: "sm" }}
      transition="all 0.2s ease-in-out"
    >
      <HStack spacing={4} align="start">
        <Box>{getActivityIcon(activity.type)}</Box>

        <Avatar
          size="sm"
          name={activity.user.nickname}
          src={activity.user.avatar}
          bg="brand.100"
          color="brand.500"
        />

        <VStack align="start" spacing={2} flex={1}>
          {getActivityText(activity)}

          {(activity.data.story?.excerpt || activity.data.comment?.content) && (
            <Box
              p={3}
              bg={useColorModeValue('neutral.100','neutral.800')}
              borderRadius="md"
              borderLeft="3px solid"
              borderLeftColor="neutral.300"
              w="full"
            >
              <Text fontSize="sm" color="neutral.600" fontStyle="italic">
                "{activity.data.story?.excerpt || activity.data.comment?.content}"
              </Text>
            </Box>
          )}

          <Text fontSize="xs" color="neutral.400">
            {formatDistanceToNow(new Date(activity.createdAt), {
              addSuffix: true,
              locale: tr
            })}
          </Text>
        </VStack>
      </HStack>
    </Box>
  )

  if (!token) {
    return (
      <Box maxW="4xl" mx="auto" p={6}>
        <Alert status="warning">
          <AlertIcon />
          Aktivite akışını görüntülemek için giriş yapmanız gerekiyor.
        </Alert>
      </Box>
    )
  }

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={3} align="start">
          <HStack spacing={3}>
            <FiActivity size={24} color="var(--chakra-colors-brand-500)" />
            <Text fontSize="2xl" fontWeight="bold" color="neutral.800">
              Aktivite Akışı
            </Text>
          </HStack>
          <Text fontSize="md" color="neutral.600">
            Takip ettiğiniz kullanıcıların ve kendi aktivitelerinizin özeti
          </Text>
        </VStack>

        {/* Tabs */}
        <Tabs index={activeTab} onChange={handleTabChange} colorScheme="brand">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FiUsers />
                <Text>Takip Ettiğim</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiActivity />
                <Text>Aktivitelerim</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Feed Activities */}
            <TabPanel px={0}>
              {loading && feedActivities.length === 0 && (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="brand.500" />
                </Flex>
              )}

              {!loading && feedActivities.length === 0 && (
                <Box textAlign="center" py={12}>
                  <FiUsers size={48} color={useColorModeValue('#718096','#A0AEC0')} />
                  <Text mt={4} color={useColorModeValue('neutral.600','neutral.400')} fontSize="lg">
                    Henüz takip ettiğiniz kullanıcılardan aktivite yok
                  </Text>
                  <Text color={useColorModeValue('neutral.600','neutral.400')} fontSize="sm" mt={2}>
                    Diğer kullanıcıları takip ederek aktivitelerini burada görebilirsiniz
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/users"
                    mt={4}
                    colorScheme="brand"
                    variant="outline"
                  >
                    Kullanıcı Ara
                  </Button>
                </Box>
              )}

              {feedActivities.length > 0 && (
                <VStack spacing={4} align="stretch">
                  {feedActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}

                  {pagination.page < pagination.pages && (
                    <Box textAlign="center" pt={4}>
                      <Button
                        onClick={loadMore}
                        isLoading={loading}
                        loadingText="Yükleniyor..."
                        variant="outline"
                        colorScheme="brand"
                      >
                        Daha Fazla Yükle
                      </Button>
                    </Box>
                  )}
                </VStack>
              )}
            </TabPanel>

            {/* My Activities */}
            <TabPanel px={0}>
              {loading && myActivities.length === 0 && (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="brand.500" />
                </Flex>
              )}

              {!loading && myActivities.length === 0 && (
                <Box textAlign="center" py={12}>
                  <FiActivity size={48} color={useColorModeValue('#718096','#A0AEC0')} />
                  <Text mt={4} color={useColorModeValue('neutral.600','neutral.400')} fontSize="lg">
                    Henüz hiç aktiviteniz yok
                  </Text>
                  <Text color={useColorModeValue('neutral.600','neutral.400')} fontSize="sm" mt={2}>
                    Hikaye paylaşın veya yorum yapın
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/stories/new"
                    mt={4}
                    colorScheme="brand"
                  >
                    İlk Hikayen
                  </Button>
                </Box>
              )}

              {myActivities.length > 0 && (
                <VStack spacing={4} align="stretch">
                  {myActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}

                  {pagination.page < pagination.pages && (
                    <Box textAlign="center" pt={4}>
                      <Button
                        onClick={loadMore}
                        isLoading={loading}
                        loadingText="Yükleniyor..."
                        variant="outline"
                        colorScheme="brand"
                      >
                        Daha Fazla Yükle
                      </Button>
                    </Box>
                  )}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default ActivityFeedPage