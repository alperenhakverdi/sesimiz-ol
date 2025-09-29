import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Stack,
  Button,
  IconButton,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  useToast,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FiEdit2, FiTrash2, FiExternalLink, FiBookOpen, FiUser } from 'react-icons/fi'
import { userAPI, storyAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ensureAvatar } from '../../utils/avatar'

const StoryListItem = ({ story, onEdit, onDelete, isOwner }) => {
  const borderColor = useColorModeValue('neutral.200', 'neutral.600')
  const mutedText = useColorModeValue('neutral.600', 'neutral.300')
  const subtleBg = useColorModeValue('neutral.50', 'neutral.700')
  const createdAt = useMemo(() => {
    try {
      if (!story.createdAt) return null
      const value = new Date(story.createdAt)
      if (Number.isNaN(value.getTime())) return null
      return {
        distance: formatDistanceToNow(value, { addSuffix: true, locale: tr }),
        full: format(value, 'd MMMM yyyy', { locale: tr })
      }
    } catch (error) {
      console.error('Story date parse error', error)
      return null
    }
  }, [story.createdAt])

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      bg={subtleBg}
    >
      <Stack direction={{ base: 'column', md: 'row' }} spacing={4} justify="space-between" align={{ base: 'stretch', md: 'center' }}>
        <VStack align="start" spacing={2} flex="1">
          <Heading as={RouterLink} to={`/hikayeler/${story.id}`} size="md" _hover={{ color: 'accent.500' }}>
            {story.title}
          </Heading>
          {createdAt && (
            <Text fontSize="sm" color={mutedText}>
              {createdAt.distance} · {createdAt.full}
            </Text>
          )}
          <Text fontSize="sm" color={mutedText} noOfLines={3}>
            {story.content?.slice(0, 220) || 'Hikâye içeriği yakında'}
            {story.content && story.content.length > 220 ? '…' : ''}
          </Text>
          {typeof story.likesCount === 'number' && (
            <Text fontSize="xs" color={mutedText}>
              {story.likesCount} beğeni · {story.commentCount ?? 0} yorum
            </Text>
          )}
        </VStack>

        <HStack spacing={2} alignSelf="flex-start">
          <IconButton
            icon={<FiExternalLink />}
            aria-label="Hikâyeyi görüntüle"
            as={RouterLink}
            to={`/hikayeler/${story.id}`}
            variant="ghost"
          />
          {isOwner && (
            <>
              <IconButton
                icon={<FiEdit2 />}
                aria-label="Hikâyeyi düzenle"
                variant="ghost"
                onClick={() => onEdit(story.id)}
              />
              <IconButton
                icon={<FiTrash2 />}
                aria-label="Hikâyeyi sil"
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete(story.id)}
              />
            </>
          )}
        </HStack>
      </Stack>
    </Box>
  )
}

const ProfileSkeleton = () => (
  <VStack spacing={6} align="stretch">
    <Skeleton height="120px" borderRadius="lg" />
    <Skeleton height="60px" borderRadius="lg" />
    <SkeletonText mt="4" noOfLines={6} spacing="4" skeletonHeight="18px" />
  </VStack>
)

const UserProfile = ({ userId = null }) => {
  const { user: authUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const surfaceBg = useColorModeValue('white', 'neutral.800')
  const surfaceBorder = useColorModeValue('neutral.200', 'neutral.600')
  const mutedText = useColorModeValue('neutral.600', 'neutral.300')

  const [profile, setProfile] = useState(null)
  const [stories, setStories] = useState([])
  const [profileError, setProfileError] = useState('')
  const [storiesError, setStoriesError] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingStories, setIsLoadingStories] = useState(true)
  const [isDeletingStory, setIsDeletingStory] = useState(false)

  const resolvedUserId = useMemo(() => {
    if (userId) return Number(userId)
    return authUser?.id ?? null
  }, [userId, authUser?.id])

  const isOwnProfile = useMemo(() => {
    return Boolean(isAuthenticated && authUser && resolvedUserId && authUser.id === resolvedUserId)
  }, [isAuthenticated, authUser, resolvedUserId])

  useEffect(() => {
    if (!resolvedUserId) {
      setProfileError('Profil bilgilerine erişebilmek için giriş yapmanız gerekiyor.')
      setIsLoadingProfile(false)
      return
    }

    let ignore = false
    setIsLoadingProfile(true)
    setProfileError('')

    ;(async () => {
      try {
        const response = await userAPI.getProfile(resolvedUserId)
        if (ignore) return
        if (response?.success) {
          setProfile(response.data)
        } else {
          setProfile(null)
          setProfileError(response?.error?.message || 'Profil bilgileri yüklenemedi.')
        }
      } catch (error) {
        if (!ignore) {
          setProfile(null)
          setProfileError(error?.message || 'Profil bilgileri yüklenirken bir hata oluştu.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingProfile(false)
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [resolvedUserId])

  useEffect(() => {
    if (!resolvedUserId) {
      setStories([])
      setIsLoadingStories(false)
      return
    }

    let ignore = false
    setIsLoadingStories(true)
    setStoriesError('')

    ;(async () => {
      try {
        const response = await userAPI.getStories(resolvedUserId)
        if (ignore) return
        if (response?.success) {
          setStories(response.data || [])
        } else {
          setStories([])
          setStoriesError(response?.error?.message || 'Hikâyeler yüklenemedi.')
        }
      } catch (error) {
        if (!ignore) {
          setStories([])
          setStoriesError(error?.message || 'Hikâyeler yüklenirken bir hata oluştu.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingStories(false)
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [resolvedUserId])

  const handleEditStory = useCallback((storyId) => {
    navigate(`/hikaye-olustur?storyId=${storyId}`)
  }, [navigate])

  const handleDeleteStory = useCallback(async (storyId) => {
    if (!authUser) return
    const confirm = window.confirm('Bu hikâyeyi silmek istediğinizden emin misiniz?')
    if (!confirm) return

    try {
      setIsDeletingStory(true)
      await storyAPI.delete(storyId, authUser.id)
      setStories(prev => prev.filter(story => story.id !== storyId))
      toast({
        title: 'Hikâye silindi',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error) {
      console.error('Story delete error:', error)
      toast({
        title: 'Hikâye silinemedi',
        description: error?.message || 'Bir hata meydana geldi.',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
    } finally {
      setIsDeletingStory(false)
    }
  }, [authUser, toast])

  const storyCount = useMemo(() => {
    if (profile?._count?.stories !== undefined) return profile._count.stories
    return stories.length
  }, [profile?._count, stories.length])

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null
    try {
      const date = new Date(profile.createdAt)
      if (Number.isNaN(date.getTime())) return null
      return {
        distance: formatDistanceToNow(date, { addSuffix: true, locale: tr }),
        full: format(date, 'd MMMM yyyy', { locale: tr })
      }
    } catch (error) {
      console.error('Profile date parse error', error)
      return null
    }
  }, [profile?.createdAt])

  const initialTab = searchParams.get('section') === 'stories' ? 1 : 0
  const [tabIndex, setTabIndex] = useState(initialTab)

  useEffect(() => {
    const nextTab = searchParams.get('section') === 'stories' ? 1 : 0
    setTabIndex(nextTab)
  }, [searchParams])

  const handleTabChange = (index) => {
    setTabIndex(index)
    const next = new URLSearchParams(searchParams)
    if (index === 1) {
      next.set('section', 'stories')
    } else {
      next.delete('section')
    }
    setSearchParams(next, { replace: true })
  }

  if (!resolvedUserId) {
    return (
      <Container maxW="container.lg" py={12}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Profil bilgilerine erişebilmek için giriş yapmanız gerekiyor.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={10} align="stretch">
        {isLoadingProfile ? (
          <ProfileSkeleton />
        ) : profileError ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {profileError}
          </Alert>
        ) : (
          <Box bg={surfaceBg} borderRadius="lg" borderWidth="1px" borderColor={surfaceBorder} p={{ base: 6, md: 8 }}>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={8} align={{ base: 'flex-start', md: 'center' }}>
              <Avatar
                size="2xl"
                name={profile.nickname}
                src={ensureAvatar(profile.avatar, profile.nickname)}
                bg="brand.100"
                color="brand.500"
              />
              <VStack align="flex-start" spacing={4} flex="1">
                <HStack spacing={3} align="center">
                  <Heading size="lg">@{profile.nickname}</Heading>
                  {isOwnProfile && (
                    <Badge colorScheme="accent" fontSize="0.75rem" px={3} py={1} borderRadius="full">
                      Benim Profilim
                    </Badge>
                  )}
                </HStack>
                {profile.bio && (
                  <Text color={mutedText}>{profile.bio}</Text>
                )}
                <HStack spacing={4} color={mutedText} fontSize="sm">
                  <HStack spacing={1}>
                    <FiUser />
                    <Text>{storyCount} hikâye</Text>
                  </HStack>
                  {memberSince && (
                    <HStack spacing={1}>
                      <FiBookOpen />
                      <Text>{memberSince.distance} platformda</Text>
                    </HStack>
                  )}
                </HStack>
                {memberSince && (
                  <Text fontSize="xs" color={mutedText}>
                    Katılım tarihi: {memberSince.full}
                  </Text>
                )}
                {isOwnProfile && (
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FiBookOpen />}
                      as={RouterLink}
                      to="/hikaye-olustur"
                      colorScheme="accent"
                    >
                      Yeni Hikâye Yaz
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="accent"
                      as={RouterLink}
                      to="/ayarlar"
                    >
                      Profil Ayarları
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Stack>
          </Box>
        )}

        <Tabs index={tabIndex} onChange={handleTabChange} colorScheme="accent" variant="enclosed">
          <TabList>
            <Tab>Profil</Tab>
            <Tab>Hikayeler</Tab>
          </TabList>
          <TabPanels mt={6}>
            <TabPanel px={0}>
              <Box bg={surfaceBg} borderRadius="lg" borderWidth="1px" borderColor={surfaceBorder} p={6}>
                {profileError && (
                  <Alert status="warning" borderRadius="md" mb={4}>
                    <AlertIcon />
                    Profil bilgileri eksik olabilir.
                  </Alert>
                )}
                <VStack align="start" spacing={4}>
                  <Heading size="md">Hakkında</Heading>
                  <Text color={mutedText}>
                    {profile?.bio || 'Henüz bir biyografi eklenmemiş.'}
                  </Text>
                  <Divider />
                  <Heading size="md">İstatistikler</Heading>
                  <HStack spacing={6} flexWrap="wrap">
                    <VStack align="start" spacing={1}>
                      <Heading size="md">{storyCount}</Heading>
                      <Text fontSize="sm" color={mutedText}>Paylaşılan hikâye</Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                      <Heading size="md">{stories.length}</Heading>
                      <Text fontSize="sm" color={mutedText}>Listelenen hikâye</Text>
                    </VStack>
                    {memberSince && (
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{memberSince.full}</Heading>
                        <Text fontSize="sm" color={mutedText}>Katılım tarihi</Text>
                      </VStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
            </TabPanel>
            <TabPanel px={0}>
              {storiesError && (
                <Alert status="error" borderRadius="md" mb={4}>
                  <AlertIcon />
                  {storiesError}
                </Alert>
              )}

              {isLoadingStories ? (
                <VStack spacing={4} align="stretch">
                  <Skeleton height="120px" borderRadius="lg" />
                  <Skeleton height="120px" borderRadius="lg" />
                </VStack>
              ) : stories.length === 0 ? (
                <Box bg={surfaceBg} borderRadius="lg" borderWidth="1px" borderColor={surfaceBorder} p={10} textAlign="center">
                  <VStack spacing={4}>
                    <Heading size="md">Henüz hikâye paylaşılmamış</Heading>
                    <Text color={mutedText}>Bu kullanıcının hikâyeleri burada listelenecek.</Text>
                    {isOwnProfile && (
                      <Button colorScheme="accent" leftIcon={<FiBookOpen />} as={RouterLink} to="/hikaye-olustur">
                        İlk hikâyeni paylaş
                      </Button>
                    )}
                  </VStack>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {stories.map((story) => (
                    <StoryListItem
                      key={story.id}
                      story={story}
                      onEdit={handleEditStory}
                      onDelete={handleDeleteStory}
                      isOwner={isOwnProfile}
                    />
                  ))}
                </VStack>
              )}
              {isDeletingStory && (
                <Text mt={4} fontSize="xs" color={mutedText}>
                  İşlem devam ediyor...
                </Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  )
}

export default UserProfile
