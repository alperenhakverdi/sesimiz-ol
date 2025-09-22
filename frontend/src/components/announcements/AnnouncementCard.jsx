import { Box, VStack, HStack, Text, Badge, Icon, useColorModeValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { FaBullhorn, FaInfoCircle, FaCalendarAlt, FaUsers } from 'react-icons/fa'

const AnnouncementCard = ({ announcement }) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBorderColor = useColorModeValue('accent.300', 'accent.500')
  const accentColor = useColorModeValue('accent.500', 'accent.300')

  const typeColors = {
    GENERAL: 'blue',
    USER: 'green',
    ORGANIZATION: 'purple',
    ADMIN: 'red',
  }

  const typeIcons = {
    GENERAL: FaInfoCircle,
    USER: FaUsers,
    ORGANIZATION: FaBullhorn,
    ADMIN: FaCalendarAlt,
  }

  return (
    <Box
      as={RouterLink}
      to={`/duyurular/${announcement.id}`}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
      p={5}
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease-in-out"
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: hoverBorderColor,
      }}
      h="full"
    >
      <HStack mb={2} justifyContent="space-between" alignItems="center">
        <HStack>
          <Icon as={typeIcons[announcement.type]} color={typeColors[announcement.type] + '.500'} />
          <Badge colorScheme={typeColors[announcement.type]} variant="subtle" borderRadius="md">
            {announcement.type === 'GENERAL' ? 'Genel' : 
             announcement.type === 'USER' ? 'Kullanıcı' : 
             announcement.type === 'ORGANIZATION' ? 'STK' : 'Yönetici'}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="neutral.500">
          {format(new Date(announcement.createdAt), 'dd MMMM yyyy', { locale: tr })}
        </Text>
      </HStack>
      <VStack align="start" spacing={1} flex="1">
        <Text fontWeight="bold" fontSize="lg" color="neutral.800" noOfLines={2}>
          {announcement.title}
        </Text>
        <Text fontSize="sm" color="neutral.600" noOfLines={3}>
          {announcement.body.substring(0, 100) + '...'}
        </Text>
      </VStack>
      <Text fontSize="sm" color={accentColor} mt={3}>
        Devamını Oku →
      </Text>
    </Box>
  )
}

export default AnnouncementCard