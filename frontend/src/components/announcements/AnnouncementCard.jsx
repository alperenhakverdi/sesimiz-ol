import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Heading,
  useColorModeValue,
  Icon
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiCalendar, FiUsers } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const AnnouncementCard = ({ announcement }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const accentBorderColor = useColorModeValue('accent.200', 'accent.700')

  const getTypeColor = (type) => {
    const colors = {
      GENERAL: 'blue',
      USER: 'purple',
      ORGANIZATION: 'teal',
      ADMIN: 'orange'
    }
    return colors[type] || 'blue'
  }

  const getTypeLabel = (type) => {
    const labels = {
      GENERAL: 'Genel',
      USER: 'Kullanıcılar',
      ORGANIZATION: 'STK\'lar',
      ADMIN: 'Adminler'
    }
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: tr
      })
    } catch {
      return ''
    }
  }

  return (
    <Box
      as={RouterLink}
      to={`/duyurular/${announcement.id}`}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderLeftWidth="4px"
      borderLeftColor="accent.500"
      borderRadius="lg"
      p={6}
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'lg',
        borderLeftColor: 'accent.600',
        borderColor: accentBorderColor
      }}
      cursor="pointer"
      textDecoration="none"
      _focus={{ boxShadow: 'outline' }}
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <Badge colorScheme={getTypeColor(announcement.type)} size="sm">
            {getTypeLabel(announcement.type)}
          </Badge>
          
          <HStack spacing={2} color={textColor} fontSize="sm">
            <Icon as={FiCalendar} boxSize={4} />
            <Text>{formatDate(announcement.createdAt)}</Text>
          </HStack>
        </HStack>

        {/* Content */}
        <VStack spacing={3} align="stretch">
          <Heading size="md" color="accent.600" noOfLines={2}>
            {announcement.title}
          </Heading>
          
          <Text color={textColor} fontSize="sm" noOfLines={3}>
            {announcement.content}
          </Text>
        </VStack>

        {/* Footer */}
        <HStack justify="space-between" align="center">
          <HStack spacing={2} color={textColor} fontSize="sm">
            <Icon as={FiUsers} boxSize={4} />
            <Text>
              {announcement.recipientCount || 0} kişiye gönderildi
            </Text>
          </HStack>

          {announcement.status === 'SENT' && (
            <Badge colorScheme="green" size="sm" variant="subtle">
              Gönderildi
            </Badge>
          )}
          
          {announcement.status === 'SCHEDULED' && (
            <Badge colorScheme="yellow" size="sm" variant="subtle">
              Zamanlandı
            </Badge>
          )}
        </HStack>
      </VStack>
    </Box>
  )
}

export default AnnouncementCard
