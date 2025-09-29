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

const CURATED_ORGANIZATIONS = [
  {
    id: 'mor-cati',
    slug: 'mor-cati',
    name: 'Mor Çatı Kadın Sığınağı Vakfı',
    type: 'FOUNDATION',
    status: 'ACTIVE',
    description: 'Şiddete maruz kalan kadınlara ve çocuklarına dayanışma, hukuki ve psikolojik destek sunan bağımsız kadın örgütü.',
    location: 'İstanbul',
    memberCount: 320,
    icon: 'https://img.icons8.com/color/96/lotus.png',
    website: 'https://www.morcati.org.tr/'
  },
  {
    id: 'kamer-vakfi',
    slug: 'kamer-vakfi',
    name: 'KAMER Vakfı',
    type: 'FOUNDATION',
    status: 'ACTIVE',
    description: 'Kadınların şiddetsiz bir yaşam sürmesi ve toplumsal hayata katılımı için Doğu ve Güneydoğu Anadolu’da çalışan kadın örgütü.',
    location: 'Diyarbakır',
    memberCount: 210,
    icon: 'https://img.icons8.com/color/96/handshake.png',
    website: 'https://kamer.org.tr/'
  },
  {
    id: 'kadin-dayanisma',
    slug: 'kadin-dayanisma',
    name: 'Kadın Dayanışma Vakfı',
    type: 'FOUNDATION',
    status: 'ACTIVE',
    description: 'Kadınlara yönelik şiddetle mücadele eden, destek merkezleri ve dayanışma ağları ile bilinen bağımsız vakıf.',
    location: 'Ankara',
    memberCount: 180,
    icon: 'https://img.icons8.com/color/96/charity.png',
    website: 'https://www.kadindayanismavakfi.org.tr/'
  },
  {
    id: 'ucan-supurge',
    slug: 'ucan-supurge',
    name: 'Uçan Süpürge Kadın İletişim ve Araştırma Derneği',
    type: 'ASSOCIATION',
    status: 'ACTIVE',
    description: 'Kadın hakları haberciliği ve yerel kadın örgütleri ağlarıyla toplumsal cinsiyet eşitliği için çalışan dernek.',
    location: 'Ankara',
    memberCount: 95,
    icon: 'https://img.icons8.com/color/96/broom.png',
    website: 'https://ucansupurge.org.tr/'
  },
  {
    id: 'esitlik-icin-kadin-platformu',
    slug: 'esitlik-icin-kadin-platformu',
    name: 'Eşitlik İçin Kadın Platformu (EŞİK)',
    type: 'NGO',
    status: 'ACTIVE',
    description: 'Kadın örgütlerinin ortak platformu olarak hak savunuculuğu ve politika izleme çalışmaları yapan ağ yapısı.',
    location: 'Türkiye Genelinde',
    memberCount: 260,
    icon: 'https://img.icons8.com/color/96/standing-woman.png',
    website: 'https://esikplatform.net/'
  }
]

const buildTypeBreakdown = (list = []) => {
  return list.reduce((acc, org) => {
    if (!org?.type) return acc
    acc[org.type] = (acc[org.type] || 0) + 1
    return acc
  }, {})
}

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [stats, setStats] = useState({})

  const bgColor = useColorModeValue('neutral.50', 'neutral.900')
  const subtleTextColor = useColorModeValue('neutral.600', 'neutral.400')
  const headerTextColor = useColorModeValue('neutral.600', 'neutral.300')
  const searchIconColor = useColorModeValue('neutral.500', 'neutral.400')
  const inputBg = useColorModeValue('white', 'neutral.800')
  const inputBorderColor = useColorModeValue('neutral.200', 'neutral.700')
  const inputHoverBorderColor = useColorModeValue('neutral.300', 'neutral.600')

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
          api.get('/organizations/stats')
        ])
        let nextOrganizations = CURATED_ORGANIZATIONS
        if (orgsResponse?.success) {
          const remoteOrganizations = orgsResponse.data?.organizations || []
          nextOrganizations = remoteOrganizations.length > 0 ? remoteOrganizations : CURATED_ORGANIZATIONS
        }
        setOrganizations(nextOrganizations)

        let nextStats = {}
        if (statsResponse?.success) {
          nextStats = statsResponse.data || {}
        }
        if (!nextStats.typeBreakdown) {
          nextStats = {
            ...nextStats,
            typeBreakdown: buildTypeBreakdown(nextOrganizations)
          }
        }
        setStats(nextStats)
      } catch (err) {
        console.error('Organizations fetch error:', err)
        setOrganizations(CURATED_ORGANIZATIONS)
        setStats({ typeBreakdown: buildTypeBreakdown(CURATED_ORGANIZATIONS) })
        setError(null)
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
              <Text color={subtleTextColor}>STK'lar yükleniyor...</Text>
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
            <Text fontSize="lg" color={headerTextColor} maxW="2xl">
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
                <FiSearch color={searchIconColor} />
              </InputLeftElement>
              <Input
                placeholder="STK adı veya açıklama ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={inputBg}
                borderColor={inputBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _focus={{ borderColor: "accent.500", boxShadow: "0 0 0 1px var(--chakra-colors-accent-500)" }}
              />
            </InputGroup>
            
            <Select 
              placeholder="Tür Seçin"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              bg={inputBg}
              borderColor={inputBorderColor}
              _hover={{ borderColor: inputHoverBorderColor }}
              maxW="200px"
            >
              <option value="NGO">STK</option>
              <option value="FOUNDATION">Vakıf</option>
              <option value="ASSOCIATION">Dernek</option>
              <option value="COOPERATIVE">Kooperatif</option>
            </Select>
          </HStack>

          {/* Results Count */}
          <Text textAlign="center" color={subtleTextColor}>
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
                <Text fontSize="lg" color={subtleTextColor}>
                  Arama kriterlerinize uygun STK bulunamadı
                </Text>
                <Text fontSize="sm" color={subtleTextColor}>
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
