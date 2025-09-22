import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  SimpleGrid,
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import OrganizationCard from '../components/organizations/OrganizationCard'
import { api } from '../services/api'

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [stats, setStats] = useState({})

  const bgColor = useColorModeValue('gray.50', 'gray.900')

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        
        // Fetch organizations and stats in parallel
        const [orgsResponse, statsResponse] = await Promise.all([
          api.get('/organizations', {
            params: {
              page: 1,
              limit: 50,
              search: searchQuery,
              type: typeFilter
            }
          }),
          api.get('/api/stats/organizations')
        ])

        setOrganizations(orgsResponse.data.data.organizations)
        setStats(statsResponse.data.data)
      } catch (err) {
        console.error('Organizations fetch error:', err)
        setError('STK listesi yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [searchQuery, typeFilter])

  const getTypeCount = (type) => {
    return stats.typeBreakdown?.[type] || 0
  }

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="accent.500" thickness="4px" />
              <Text color="gray.500">STK'lar yükleniyor...</Text>
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
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading size="xl" color="accent.600">
              Sivil Toplum Kuruluşları
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Toplumsal değişim için çalışan, dayanışmayı güçlendiren STK'larımızla tanışın
            </Text>
          </VStack>

          {/* Stats */}
          <HStack spacing={4} justify="center" flexWrap="wrap">
            <Badge colorScheme="blue" px={3} py={1} fontSize="sm">
              {getTypeCount('NGO')} STK
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} fontSize="sm">
              {getTypeCount('FOUNDATION')} Vakıf
            </Badge>
            <Badge colorScheme="teal" px={3} py={1} fontSize="sm">
              {getTypeCount('ASSOCIATION')} Dernek
            </Badge>
            <Badge colorScheme="orange" px={3} py={1} fontSize="sm">
              {getTypeCount('COOPERATIVE')} Kooperatif
            </Badge>
          </HStack>

          {/* Filters */}
          <HStack spacing={4} maxW="2xl" mx="auto" w="full">
            <InputGroup flex={2}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="STK adı veya açıklama ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: "accent.500", boxShadow: "0 0 0 1px var(--chakra-colors-accent-500)" }}
              />
            </InputGroup>
            
            <Select 
              placeholder="Tür Seçin"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              bg="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              maxW="200px"
            >
              <option value="NGO">STK</option>
              <option value="FOUNDATION">Vakıf</option>
              <option value="ASSOCIATION">Dernek</option>
              <option value="COOPERATIVE">Kooperatif</option>
            </Select>
          </HStack>

          {/* Results Count */}
          <Text textAlign="center" color="gray.600">
            {organizations.length} STK listeleniyor
          </Text>

          {/* Organizations Grid */}
          {organizations.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {organizations.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </SimpleGrid>
          ) : (
            <Center py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  Arama kriterlerinize uygun STK bulunamadı
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Farklı anahtar kelimeler deneyebilir veya filtreleri temizleyebilirsiniz
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default OrganizationsPage
