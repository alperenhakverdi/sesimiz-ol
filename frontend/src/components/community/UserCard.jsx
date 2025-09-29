import { Box, VStack, HStack, Avatar, Text, Badge, Button, useColorModeValue } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaBook, FaCommentDots } from 'react-icons/fa'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const UserCard = ({ user, showActions = true }) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBorderColor = useColorModeValue('accent.300', 'accent.500')

  const userRoleColors = {
    ADMIN: 'red',
    USER: 'blue',
    ORG: 'purple',
  }

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
      p={6}
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
      transition="all 0.2s ease-in-out"
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: hoverBorderColor,
      }}
      h="full"
    >
      <Avatar 
        size="xl" 
        name={user.nickname} 
        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`} 
        mb={4} 
      />
      <VStack spacing={1} flex="1">
        <Text fontWeight="bold" fontSize="xl" color="neutral.800">
          {user.nickname}
        </Text>
        {user.bio && (
          <Text fontSize="sm" color="neutral.500" noOfLines={2}>
            {user.bio}
          </Text>
        )}
        <Badge colorScheme={user.isOrganizationRep ? userRoleColors.ORG : (userRoleColors[user.role] || 'gray')} variant="subtle" px={2} py={1} borderRadius="md">
          {user.isOrganizationRep ? 'STK Temsilcisi' : (user.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı')}
        </Badge>
        <HStack spacing={4} mt={3}>
          <HStack>
            <FaBook color="neutral.500" />
            <Text fontSize="sm" color="neutral.600">{user.storyCount || 0} Hikaye</Text>
          </HStack>
          <HStack>
            <FaCommentDots color="neutral.500" />
            <Text fontSize="sm" color="neutral.600">{user.commentCount || 0} Yorum</Text>
          </HStack>
        </HStack>
        <Text fontSize="xs" color="neutral.400" mt={2}>
          Katıldı: {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: tr })}
        </Text>
      </VStack>
      {showActions && (
        <Button
          as={RouterLink}
          to={`/profil/${user.nickname}`}
          colorScheme="accent"
          variant="solid"
          mt={6}
          w="full"
        >
          Profili Görüntüle
        </Button>
      )}
    </Box>
  )
}

export default UserCard
