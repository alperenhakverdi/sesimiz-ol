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

  const bgColor = useColorModeValue('neutral.50', 'neutral.900')
  const headingColor = useColorModeValue('primary.800', 'neutral.100')
  const supportingTextColor = useColorModeValue('neutral.600', 'neutral.300')
  const statBg = useColorModeValue('white', 'neutral.800')
  const statLabelColor = useColorModeValue('neutral.600', 'neutral.300')
  const searchIconColor = useColorModeValue('neutral.500', 'neutral.400')
  const resultsTextColor = useColorModeValue('neutral.600', 'neutral.400')

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
        if (usersResponse?.success) {
          setUsers(usersResponse.data?.users || [])
        } else {
          setUsers([])
        }
        if (statsResponse?.success) {
          setStats(statsResponse.data || {})
        } else {
          setStats({})
        }
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
            <Heading as="h1" size="xl" color={headingColor}>
              Topluluk Üyeleri
            </Heading>
            <Text fontSize="lg" color={supportingTextColor} maxW="2xl">
              Platformumuzdaki aktif kullanıcıları ve STK temsilcilerini keşfedin.
            </Text>
          </VStack>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} py={4}>
            <Stat bg={statBg} p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color={statLabelColor}>Toplam Üye</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="accent.500">
                {stats.totalUsers || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Son 30 gün: {stats.recentUsers || 0}
              </StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color={statLabelColor}>Aktif Hikaye</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="accent.500">
                {stats.totalStories || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Tüm zamanlar
              </StatHelpText>
            </Stat>
            <Stat bg={statBg} p={4} borderRadius="lg" shadow="sm" textAlign="center">
              <StatLabel fontSize="sm" color={statLabelColor}>STK Temsilcisi</StatLabel>
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
                  <SearchIcon color={searchIconColor} />
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
          <Text textAlign="center" color={resultsTextColor}>
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