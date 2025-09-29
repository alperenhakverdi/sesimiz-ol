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

  const bgColor = useColorModeValue('neutral.50', 'neutral.900')
  const cardBgColor = useColorModeValue('white', 'neutral.800')
  const borderColor = useColorModeValue('neutral.200', 'neutral.700')
  const muted = useColorModeValue('neutral.600', 'neutral.400')
  const subtle = useColorModeValue('neutral.500', 'neutral.500')
  const headingColor = useColorModeValue('primary.800', 'neutral.100')
  const breadcrumbSeparatorColor = useColorModeValue('neutral.500', 'neutral.400')

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)
        
        const response = await api.get(`/organizations/${slug}`)

        if (response?.success && response?.data) {
          setOrganization(response.data)
          setError(null)
        } else {
          const message = response?.error?.message || 'STK bilgileri yüklenirken bir hata oluştu.'
          setError(message)
          setOrganization(null)
        }
      } catch (err) {
        console.error('Organization fetch error:', err)
        setOrganization(null)
        const message = err?.message || 'STK bilgileri yüklenirken bir hata oluştu.'
        setError(message.toLowerCase().includes('bulunamad') ? 'STK bulunamadı.' : 'STK bilgileri yüklenirken bir hata oluştu.')
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
              <Text color={subtle}>STK bilgileri yükleniyor...</Text>
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

  if (!organization) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            STK bilgileri şu anda görüntülenemiyor.
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
          <Breadcrumb spacing="8px" separator={<FiChevronRight color={breadcrumbSeparatorColor} />}>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/">Ana Sayfa</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/stklar">STK'lar</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{organization?.name || 'STK Detayı'}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Hero Section */}
          <Box bg={cardBgColor} borderRadius="xl" p={8} borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
              <HStack spacing={6} align="start">
                <Avatar 
                  name={organization?.name} 
                  src={organization?.logo}
                  size="2xl"
                  bg="accent.500"
                />
                
                <VStack align="start" spacing={3} flex={1}>
                  <HStack spacing={3} flexWrap="wrap">
                    <Badge colorScheme={getTypeColor(organization?.type)} size="lg">
                      {getTypeLabel(organization?.type)}
                    </Badge>
                    <Badge colorScheme="green" size="lg" variant="subtle">
                      Aktif
                    </Badge>
                  </HStack>
                  
                  <Heading size="xl" color={headingColor}>
                    {organization?.name}
                  </Heading>
                  
                  <Text fontSize="lg" color={muted}>
                    {organization?.description || 'Bu STK için açıklama henüz eklenmemiş.'}
                  </Text>

                  <HStack spacing={6} flexWrap="wrap">
                    {organization?.website && (
                      <Button
                        as="a"
                        href={organization?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        colorScheme="accent"
                        rightIcon={<FiExternalLink />}
                      >
                        Web Sitesi
                      </Button>
                    )}
                    
                    {organization?.email && (
                      <Button
                        as="a"
                        href={`mailto:${organization?.email}`}
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
                    <Text color={muted} lineHeight="tall">
                      {organization?.longDescription}
                    </Text>
                  </VStack>
                </Box>

                {/* Activities */}
                {organization?.activities && (
                  <Box bg={cardBgColor} borderRadius="lg" p={6} borderWidth="1px" borderColor={borderColor}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Faaliyet Alanları</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                        {organization?.activities.map((activity, index) => (
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
                        <Text fontWeight="semibold">{organization?.memberCount?.toLocaleString()}</Text>
                        <Text fontSize="sm" color={subtle}>Üye</Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={3}>
                      <Icon as={FiCalendar} color="accent.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{organization?.foundedYear}</Text>
                        <Text fontSize="sm" color={subtle}>Kuruluş Yılı</Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={3}>
                      <Icon as={FiMapPin} color="accent.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold">{organization?.location}</Text>
                        <Text fontSize="sm" color={subtle}>Konum</Text>
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
                    {organization?.email && (
                      <HStack spacing={3}>
                        <Icon as={FiMail} color="accent.500" boxSize={5} />
                        <Text as="a" href={`mailto:${organization?.email}`} _hover={{ color: "accent.500" }}>
                          {organization?.email}
                        </Text>
                      </HStack>
                    )}

                    {organization?.phone && (
                      <HStack spacing={3}>
                        <Icon as={FiPhone} color="accent.500" boxSize={5} />
                        <Text as="a" href={`tel:${organization?.phone}`} _hover={{ color: "accent.500" }}>
                          {organization?.phone}
                        </Text>
                      </HStack>
                    )}

                    {organization?.address && (
                      <HStack spacing={3} align="start">
                        <Icon as={FiMapPin} color="accent.500" boxSize={5} mt={0.5} />
                        <Text fontSize="sm" color={muted}>
                          {organization?.address}
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