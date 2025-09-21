import { useState, useEffect } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  HStack,
  Badge,
  Link,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])

  const borderColor = useColorModeValue('blue.200', 'blue.700')

  // Mock data for MVP
  const mockAnnouncements = [
    {
      id: 1,
      title: 'Yeni STK Kayıt Sistemi Aktif!',
      content: 'STK\'lar artık platforma daha kolay kayıt olabilir. Detaylar için duyurular sayfasını ziyaret edin.',
      type: 'GENERAL',
      priority: 'HIGH',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
    setDismissedIds(dismissed)
    
    // Load announcements
    setAnnouncements(mockAnnouncements.filter(ann => ann.isActive && ann.priority === 'HIGH'))
  }, [])

  const handleDismiss = (announcementId) => {
    const newDismissed = [...dismissedIds, announcementId]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(ann => !dismissedIds.includes(ann.id))

  if (visibleAnnouncements.length === 0) {
    return null
  }

  const getAlertStatus = (type) => {
    const statusMap = {
      GENERAL: 'info',
      USER: 'info',
      ORGANIZATION: 'warning',
      ADMIN: 'error'
    }
    return statusMap[type] || 'info'
  }

  return (
    <>
      {visibleAnnouncements.map((announcement) => (
        <Alert
          key={announcement.id}
          status={getAlertStatus(announcement.type)}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          mb={4}
        >
          <AlertIcon />
          <HStack flex="1" align="start" spacing={3}>
            <div>
              <HStack spacing={2} mb={1}>
                <AlertTitle fontSize="md">
                  {announcement.title}
                </AlertTitle>
                <Badge colorScheme="blue" size="sm">
                  Yeni
                </Badge>
              </HStack>
              <AlertDescription fontSize="sm">
                {announcement.content}{' '}
                <Link 
                  as={RouterLink} 
                  to="/duyurular" 
                  color="blue.500" 
                  fontWeight="medium"
                  _hover={{ textDecoration: 'underline' }}
                >
                  Detayları gör →
                </Link>
              </AlertDescription>
            </div>
          </HStack>
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={() => handleDismiss(announcement.id)}
          />
        </Alert>
      ))}
    </>
  )
}

export default AnnouncementBanner
