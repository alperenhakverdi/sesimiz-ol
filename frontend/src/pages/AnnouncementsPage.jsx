import { useState, useEffect } from 'react'
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
  useColorModeValue
} from '@chakra-ui/react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import AnnouncementCard from '../components/announcements/AnnouncementCard'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'
import { api } from '../services/api'

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const headingColor = useColorModeValue('neutral.800', 'neutral.100')
  const textColor = useColorModeValue('neutral.600', 'neutral.300')
  const dividerColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        
        const response = await api.get('/announcements', {
          params: {
            page: 1,
            limit: 50,
            visibility: 'PUBLIC'
          }
        })
        
        setAnnouncements(response.data.data.announcements)
      } catch (err) {
        console.error('Announcements fetch error:', err)
        setError('Duyurular yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const groupAnnouncementsByMonth = (announcementsList) => {
    const grouped = {}
    announcementsList.forEach(announcement => {
      const date = parseISO(announcement.createdAt)
      const monthYear = format(date, 'MMMM yyyy', { locale: tr })
      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }
      grouped[monthYear].push(announcement)
    })
    return grouped
  }

  const groupedAnnouncements = groupAnnouncementsByMonth(announcements)
  const monthYears = Object.keys(groupedAnnouncements)

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

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={10} align="stretch">
          <ProgressiveLoader delay={100} type="fade">
            <VStack spacing={4} textAlign="center">
              <Heading as="h1" size="xl" color={headingColor}>
                Duyurular
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl">
                Platformumuzdaki en son güncellemeler, etkinlikler ve önemli bilgilendirmeler.
              </Text>
            </VStack>
          </ProgressiveLoader>

          {monthYears.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text fontSize="lg" color={textColor}>
                Henüz duyuru bulunmamaktadır.
              </Text>
            </Box>
          ) : (
            <VStack spacing={8} align="stretch">
              {monthYears.map((monthYear, monthIndex) => (
                <ProgressiveLoader key={monthYear} delay={200 + (monthIndex * 100)} type="fade">
                  <Box>
                    <Heading as="h2" size="md" mb={4} color={headingColor} borderBottom="1px solid" borderColor={dividerColor} pb={2}>
                      {monthYear}
                    </Heading>
                    <VStack spacing={6} align="stretch">
                      {groupedAnnouncements[monthYear].map((announcement, annIndex) => (
                        <ProgressiveLoader key={announcement.id} delay={300 + (monthIndex * 100) + (annIndex * 50)} type="fade">
                          <AnnouncementCard announcement={announcement} />
                        </ProgressiveLoader>
                      ))}
                    </VStack>
                  </Box>
                </ProgressiveLoader>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default AnnouncementsPage