import { useState, useEffect } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Divider,
  Badge,
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'
import { api } from '../services/api'

const AnnouncementDetailPage = () => {
  const { id } = useParams()
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const headingColor = useColorModeValue('neutral.800', 'neutral.100')
  const textColor = useColorModeValue('neutral.700', 'neutral.200')
  const subTextColor = useColorModeValue('neutral.600', 'neutral.300')
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true)
        
        const response = await api.get(`/announcements/${id}`)
        if (response?.success) {
          setAnnouncement(response.data)
        } else {
          setAnnouncement(null)
          setError('Duyuru bilgileri yüklenemedi.')
        }
      } catch (err) {
        console.error('Announcement fetch error:', err)
        if (err.response?.status === 404) {
          setError('Duyuru bulunamadı.')
        } else {
          setError('Duyuru bilgileri yüklenirken bir hata oluştu.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAnnouncement()
    }
  }, [id])

  const typeColors = {
    GENERAL: 'blue',
    USER: 'green',
    ORGANIZATION: 'purple',
    ADMIN: 'red',
  }

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="accent.500" thickness="4px" />
      </Center>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    )
  }

  if (!announcement) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Duyuru bilgileri yüklenemedi.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <ProgressiveLoader delay={100} type="fade">
          <Box
            bg={cardBg}
            p={{ base: 6, md: 10 }}
            borderRadius="lg"
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Badge
              colorScheme={typeColors[announcement.type]}
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
              mb={4}
            >
              {announcement.type === 'GENERAL' ? 'Genel' : 
               announcement.type === 'USER' ? 'Kullanıcı' : 
               announcement.type === 'ORGANIZATION' ? 'STK' : 'Yönetici'}
            </Badge>
            <Heading as="h1" size="xl" color={headingColor} mb={3}>
              {announcement.title}
            </Heading>
            <Text fontSize="sm" color={subTextColor} mb={6}>
              Yayınlanma Tarihi: {format(parseISO(announcement.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
            </Text>
            <Divider borderColor={borderColor} mb={6} />
            <Text fontSize="md" color={textColor} lineHeight="tall" whiteSpace="pre-wrap">
              {announcement.body}
            </Text>
          </Box>
        </ProgressiveLoader>

        <ProgressiveLoader delay={300} type="fade">
          <Box textAlign="center" pt={4}>
            <RouterLink to="/duyurular">
              <Button colorScheme="accent" variant="outline">
                Tüm Duyurulara Geri Dön
              </Button>
            </RouterLink>
          </Box>
        </ProgressiveLoader>
      </VStack>
    </Container>
  )
}

export default AnnouncementDetailPage
