import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Button,
  useColorModeValue,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiMessageSquare } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const UserCard = ({ user, showActions = true }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'red',
      USER: 'blue',
      ORGANIZATION: 'teal'
    }
    return colors[role] || 'blue'
  }

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Admin',
      USER: 'Kullanıcı',
      ORGANIZATION: 'STK Temsilcisi'
    }
    return labels[role] || role
  }

  const formatJoinDate = (dateString) => {
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
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={6}
      shadow="md"
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'lg',
        borderColor: 'accent.300'
      }}
    >
      <VStack spacing={4} align="stretch">
        {/* User Info */}
        <VStack spacing={3}>
          <Avatar 
            name={user.nickname || user.name} 
            src={user.avatar}
            size="lg"
            bg="accent.500"
          />
          
          <VStack spacing={1} textAlign="center">
            <Text fontWeight="bold" fontSize="lg">
              {user.nickname || user.name}
            </Text>
            
            <Badge colorScheme={getRoleColor(user.role)} size="sm">
              {getRoleLabel(user.role)}
            </Badge>
            
            {user.bio && (
              <Text color={textColor} fontSize="sm" noOfLines={2}>
                {user.bio}
              </Text>
            )}
          </VStack>
        </VStack>

        {/* Stats */}
        <SimpleGrid columns={2} spacing={4}>
          <Stat textAlign="center">
            <StatNumber fontSize="lg" color="accent.600">
              {user.storyCount || 0}
            </StatNumber>
            <StatLabel fontSize="xs" color={textColor}>
              Hikaye
            </StatLabel>
          </Stat>
          
          <Stat textAlign="center">
            <StatNumber fontSize="lg" color="accent.600">
              {user.commentCount || 0}
            </StatNumber>
            <StatLabel fontSize="xs" color={textColor}>
              Yorum
            </StatLabel>
          </Stat>
        </SimpleGrid>

        {/* Additional Info */}
        <VStack spacing={2} align="stretch">
          {user.location && (
            <HStack spacing={2} color={textColor} fontSize="sm">
              <Icon as={FiMapPin} boxSize={4} />
              <Text>{user.location}</Text>
            </HStack>
          )}
          
          <HStack spacing={2} color={textColor} fontSize="sm">
            <Icon as={FiCalendar} boxSize={4} />
            <Text>Katıldı: {formatJoinDate(user.createdAt)}</Text>
          </HStack>
          
          {user.lastLoginAt && (
            <Text color={textColor} fontSize="xs" textAlign="center">
              Son aktiflik: {formatJoinDate(user.lastLoginAt)}
            </Text>
          )}
        </VStack>

        {/* Actions */}
        {showActions && (
          <VStack spacing={2}>
            <Button
              as={RouterLink}
              to={`/kullanici/${user.id}`}
              size="sm"
              colorScheme="accent"
              variant="outline"
              w="full"
            >
              Profili Gör
            </Button>
            
            <Button
              as={RouterLink}
              to={`/mesajlar?user=${user.id}`}
              size="sm"
              variant="ghost"
              leftIcon={<FiMessageSquare />}
              w="full"
            >
              Mesaj Gönder
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  )
}

export default UserCard
