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

const OrganizationDetailPage = () => {
  const { slug } = useParams()
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Mock data for MVP
  const mockOrganizations = {
    'kadin-dayanisma-vakfi': {
      id: 1,
      name: 'Kadın Dayanışma Vakfı',
      slug: 'kadin-dayanisma-vakfi',
      type: 'FOUNDATION',
      status: 'ACTIVE',
      description: 'Kadınların toplumsal hayatta eşit katılımını destekleyen, şiddetle mücadele eden ve dayanışmayı güçlendiren vakıf. 1995 yılından bu yana kadın hakları alanında çalışmalarını sürdürmektedir.',
      longDescription: 'Kadın Dayanışma Vakfı, kadınların toplumsal hayatta eşit katılımını desteklemek, kadına yönelik şiddeti önlemek ve kadın dayanışmasını güçlendirmek amacıyla kurulmuştur. Vakfımız, hukuki danışmanlık, psikolojik destek, meslek edindirme kursları ve farkındalık çalışmaları yürütmektedir.',
      location: 'İstanbul',
      address: 'Beyoğlu, İstiklal Caddesi No:123, 34433 İstanbul',
      memberCount: 2500,
      foundedYear: 1995,
      website: 'https://kadindayanisma.org',
      email: 'info@kadindayanisma.org',
      phone: '+90 212 555 0123',
      logo: null,
      activities: [
        'Hukuki Danışmanlık',
        'Psikolojik Destek',
        'Meslek Edindirme Kursları',
        'Farkındalık Seminerleri',
        'Kadın Sığınma Evleri'
      ]
    },
    'cevre-koruma-dernegi': {
      id: 2,
      name: 'Çevre Koruma Derneği',
      slug: 'cevre-koruma-dernegi',
      type: 'ASSOCIATION',
      status: 'ACTIVE',
      description: 'Doğal yaşamı koruma, çevre bilincini artırma ve sürdürülebilir yaşam için çalışan dernek.',
      longDescription: 'Çevre Koruma Derneği, doğal yaşamı korumak, çevre bilincini artırmak ve sürdürülebilir yaşam tarzını yaygınlaştırmak için 2001 yılında kurulmuştur. Ağaçlandırma, temizlik kampanyaları ve çevre eğitimi programları düzenlemektedir.',
      location: 'Ankara',
      address: 'Çankaya, Kızılay Meydanı No:45, 06420 Ankara',
      memberCount: 1800,
      foundedYear: 2001,
      website: 'https://cevrekoruma.org.tr',
      email: 'iletisim@cevrekoruma.org.tr',
      phone: '+90 312 555 0456',
      logo: null,
      activities: [
        'Ağaçlandırma Kampanyaları',
        'Çevre Temizliği',
        'Eğitim Programları',
        'Geri Dönüşüm Projeleri',
        'Doğa Yürüyüşleri'
      ]
    }
  }

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const orgData = mockOrganizations[slug]
        if (orgData) {
          setOrganization(orgData)
        } else {
          setError('STK bulunamadı.')
        }
      } catch (err) {
        setError('STK bilgileri yüklenirken bir hata oluştu.')
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
