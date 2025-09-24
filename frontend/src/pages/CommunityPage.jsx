import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Box,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import UserCard from '../components/community/UserCard'
import { api } from '../services/api'

const CommunityPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [stats, setStats] = useState({})

  const bgColor = useColorModeValue('gray.50', 'gray.900')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch users and stats in parallel
        const [usersResponse, statsResponse] = await Promise.all([
          api.get('/community/users', {
            params: {
              page: 1,
              limit: 50,
              search: searchTerm,
              role: filterRole
            }
          }),
          api.get('/community/stats')
        ])

        setUsers(usersResponse.data?.data?.users || [])
        setStats(statsResponse.data?.data || {})
      } catch (err) {
        console.error('Community data fetch error:', err)
        setError('Topluluk verileri yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchTerm, filterRole])

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="accent.500" thickness="4px" />
      </Center>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Heading as="h1" size="xl" color="neutral.800">
              Topluluk Üyeleri
            </Heading>
            <Text fontSize="lg" color="neutral.600" maxW="2xl">
              Platformumuzdaki aktif kullanıcıları ve STK temsilcilerini keşfedin.
            </Text>
          </VStack>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} py={4}>
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color="neutral.600">Toplam Üye</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="accent.500">
                {stats.totalUsers || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Son 30 gün: {stats.recentUsers || 0}
              </StatHelpText>
            </Stat>
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color="neutral.600">Aktif Hikaye</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="accent.500">
                {stats.totalStories || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Tüm zamanlar
              </StatHelpText>
            </Stat>
            <Stat bg="white" p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color="neutral.600">STK Temsilcisi</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="accent.500">
                {stats.roleBreakdown?.ORGANIZATION || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Platformda
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Search and Filter */}
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="lg"
                  focusBorderColor="accent.500"
                />
              </InputGroup>
              <Select
                placeholder="Tüm Roller"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                borderRadius="lg"
                focusBorderColor="accent.500"
              >
                <option value="USER">Kullanıcı</option>
                <option value="ORGANIZATION">STK Temsilcisi</option>
                <option value="ADMIN">Yönetici</option>
              </Select>
            </SimpleGrid>
          </Box>

          {/* Results Count */}
          <Text textAlign="center" color="gray.600">
            {users.length} kullanıcı listeleniyor
          </Text>

          {/* Users Grid */}
          {users.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </SimpleGrid>
          ) : (
            <Center py={10}>
              <Text fontSize="lg" color="neutral.500">
                Aradığınız kriterlere uygun kullanıcı bulunamadı.
              </Text>
            </Center>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default CommunityPage