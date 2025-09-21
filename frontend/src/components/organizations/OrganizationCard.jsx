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
  Divider
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMapPin, FiUsers, FiExternalLink } from 'react-icons/fi'

const OrganizationCard = ({ organization }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const getTypeColor = (type) => {
    const colors = {
      NGO: 'blue',
      FOUNDATION: 'purple',
      ASSOCIATION: 'teal',
      COOPERATIVE: 'orange'
    }
    return colors[type] || 'blue'
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'green',
      PENDING: 'yellow',
      SUSPENDED: 'red'
    }
    return colors[status] || 'gray'
  }

  const getTypeLabel = (type) => {
    const labels = {
      NGO: 'STK',
      FOUNDATION: 'Vakıf',
      ASSOCIATION: 'Dernek',
      COOPERATIVE: 'Kooperatif'
    }
    return labels[type] || type
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
      cursor="pointer"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <HStack spacing={3}>
            <Avatar 
              name={organization.name} 
              src={organization.logo}
              size="md"
              bg="accent.500"
            />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                {organization.name}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={getTypeColor(organization.type)} size="sm">
                  {getTypeLabel(organization.type)}
                </Badge>
                {organization.status === 'ACTIVE' && (
                  <Badge colorScheme="green" size="sm" variant="subtle">
                    Aktif
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </HStack>

        {/* Description */}
        {organization.description && (
          <Text color={textColor} fontSize="sm" noOfLines={3}>
            {organization.description}
          </Text>
        )}

        <Divider />

        {/* Info */}
        <VStack spacing={2} align="stretch">
          {organization.location && (
            <HStack spacing={2} color={textColor}>
              <Icon as={FiMapPin} boxSize={4} />
              <Text fontSize="sm">{organization.location}</Text>
            </HStack>
          )}
          
          {organization.memberCount && (
            <HStack spacing={2} color={textColor}>
              <Icon as={FiUsers} boxSize={4} />
              <Text fontSize="sm">{organization.memberCount} üye</Text>
            </HStack>
          )}
        </VStack>

        {/* Actions */}
        <HStack spacing={2}>
          <Button
            as={RouterLink}
            to={`/stklar/${organization.slug || organization.id}`}
            size="sm"
            colorScheme="accent"
            variant="outline"
            flex={1}
            rightIcon={<FiExternalLink />}
          >
            Detayları Gör
          </Button>
          
          {organization.website && (
            <Button
              as="a"
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="ghost"
              rightIcon={<FiExternalLink />}
            >
              Web
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  )
}

export default OrganizationCard
