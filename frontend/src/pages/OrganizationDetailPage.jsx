import { useState, useEffect } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Box,
  Avatar,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react'
import {
  FiMapPin,
  FiUsers,
  FiExternalLink,
  FiMail,
  FiPhone,
  FiCalendar,
  FiChevronRight
} from 'react-icons/fi'
import { api } from '../services/api'

const OrganizationDetailPage = () => {
  const { slug } = useParams()
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)
        
        const response = await api.get(`/organizations/${slug}`)
        setOrganization(response.data.data)
      } catch (err) {
        console.error('Organization fetch error:', err)
        if (err.response?.status === 404) {
          setError('STK bulunamadı.')
        } else {
          setError('STK bilgileri yüklenirken bir hata oluştu.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchOrganization()
    }
  }, [slug])

  const getTypeColor = (type) => {
    const colors = {
      NGO: 'blue',
      FOUNDATION: 'purple',
      ASSOCIATION: 'teal',
      COOPERATIVE: 'orange'
    }
    return colors[type] || 'blue'
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

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="accent.500" thickness="4px" />
              <Text color="gray.500">STK bilgileri yükleniyor...</Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    )
  }

  if (error) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Breadcrumb */}
          <Breadcrumb spacing="8px" separator={<FiChevronRight color="gray.500" />}>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/">Ana Sayfa</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/stklar">STK'lar</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{organization.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Hero Section */}
          <Box bg={cardBgColor} borderRadius="xl" p={8} borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
              <HStack spacing={6} align="start">
                <Avatar 
                  name={organization.name} 
                  src={organization.logo}
                  size="2xl"
                  bg="accent.500"
                />
                
                <VStack align="start" spacing={3} flex={1}>
                  <HStack spacing={3} flexWrap="wrap">
                    <Badge colorScheme={getTypeColor(organization.type)} size="lg">
                      {getTypeLabel(organization.type)}
                    </Badge>
                    <Badge colorScheme="green" size="lg" variant="subtle">
                      Aktif
                    </Badge>
                  </HStack>
                  
                  <Heading size="xl" color="accent.600">
                    {organization.name}
                  </Heading>
                  
                  <Text fontSize="lg" color="gray.600">
                    {organization.description}
                  </Text>

                  <HStack spacing={6} flexWrap="wrap">
                    {organization.website && (
                      <Button
                        as="a"
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        colorScheme="accent"
                        rightIcon={<FiExternalLink />}
                      >
                        Web Sitesi
                      </Button>
                    )}
                    
                    {organization.email && (
                      <Button
                        as="a"
                        href={`mailto:${organization.email}`}
                        variant="outline"
                        colorScheme="accent"
                        rightIcon={<FiMail />}
                      >
                        İletişim
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
            {/* Main Content */}
            <Box gridColumn={{ lg: "span 2" }}>
              <VStack spacing={6} align="stretch">
                {/* About */}
                <Box bg={cardBgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Hakkında</Heading>
                    <Text color="gray.600" lineHeight="tall">
                      {organization.longDescription}
                    </Text>
                  </VStack>
                </Box>

                {/* Activities */}
                {organization.activities && (
                  <Box bg={cardBgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Faaliyet Alanları</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                        {organization.activities.map((activity, index) => (
                          <HStack key={index} spacing={2}>
                            <Box w={2} h={2} bg="accent.500" borderRadius="full" mt={2} />
                            <Text>{activity}</Text>
                          </HStack>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Sidebar */}
            <VStack spacing={6} align="stretch">
              {/* Stats */}
              <Box bg={cardBgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">İstatistikler</Heading>
                  
                  <VStack spacing={3} align="stretch">
                    <HStack spacing={3}>
                      <Icon as={FiUsers} color="accent.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{organization.memberCount?.toLocaleString()}</Text>
                        <Text fontSize="sm" color="gray.500">Üye</Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={3}>
                      <Icon as={FiCalendar} color="accent.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{organization.foundedYear}</Text>
                        <Text fontSize="sm" color="gray.500">Kuruluş Yılı</Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={3}>
                      <Icon as={FiMapPin} color="accent.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{organization.location}</Text>
                        <Text fontSize="sm" color="gray.500">Konum</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>

              {/* Contact Info */}
              <Box bg={cardBgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">İletişim Bilgileri</Heading>
                  
                  <VStack spacing={3} align="stretch">
                    {organization.email && (
                      <HStack spacing={3}>
                        <Icon as={FiMail} color="accent.500" boxSize={5} />
                        <Text as="a" href={`mailto:${organization.email}`} _hover={{ color: "accent.500" }}>
                          {organization.email}
                        </Text>
                      </HStack>
                    )}

                    {organization.phone && (
                      <HStack spacing={3}>
                        <Icon as={FiPhone} color="accent.500" boxSize={5} />
                        <Text as="a" href={`tel:${organization.phone}`} _hover={{ color: "accent.500" }}>
                          {organization.phone}
                        </Text>
                      </HStack>
                    )}

                    {organization.address && (
                      <HStack spacing={3} align="start">
                        <Icon as={FiMapPin} color="accent.500" boxSize={5} mt={0.5} />
                        <Text fontSize="sm" color="gray.600">
                          {organization.address}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}

export default OrganizationDetailPage
