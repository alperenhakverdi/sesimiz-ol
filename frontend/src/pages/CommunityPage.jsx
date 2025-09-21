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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import UserCard from '../components/community/UserCard'

const CommunityPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [stats, setStats] = useState({})

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBgColor = useColorModeValue('white', 'gray.800')

  // Mock data for MVP
  const mockUsers = [
    {
      id: 1,
      nickname: 'ayse_kadin_hakları',
      name: 'Ayşe Demir',
      role: 'ORGANIZATION',
      bio: 'Kadın hakları savunucusu, 15 yıllık STK deneyimi',
      location: 'İstanbul',
      avatar: null,
      storyCount: 23,
      commentCount: 156,
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      nickname: 'mehmet_cevre',
      name: 'Mehmet Özkan',
      role: 'USER',
      bio: 'Çevre gönüllüsü, doğa fotoğrafçısı',
      location: 'Ankara',
      avatar: null,
      storyCount: 45,
      commentCount: 289,
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      nickname: 'zeynep_egitim',
      name: 'Zeynep Yılmaz',
      role: 'USER',
      bio: 'Eğitim gönüllüsü, öğretmen',
      location: 'İzmir',
      avatar: null,
      storyCount: 12,
      commentCount: 67,
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      nickname: 'admin_sesimizol',
      name: 'Platform Yöneticisi',
      role: 'ADMIN',
      bio: 'Sesimiz Ol platform yöneticisi',
      location: 'İstanbul',
      avatar: null,
      storyCount: 8,
      commentCount: 245,
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      nickname: 'can_yasli_bakim',
      name: 'Can Şahin',
      role: 'ORGANIZATION',
      bio: 'Yaşlı bakım koordinatörü',
      location: 'Bursa',
      avatar: null,
      storyCount: 18,
      commentCount: 92,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 6,
      nickname: 'fatma_cocuk_hakları',
      name: 'Fatma Kaya',
      role: 'USER',
      bio: 'Çocuk hakları gönüllüsü, psikolog',
      location: 'Adana',
      avatar: null,
      storyCount: 31,
      commentCount: 178,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ]

  const mockStats = {
    totalUsers: 5247,
    activeUsers: 1823,
    newThisMonth: 234,
    totalStories: 1456,
    totalComments: 8934
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setUsers(mockUsers)
        setStats(mockStats)
      } catch (err) {
        setError('Topluluk verileri yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = roleFilter === '' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="accent.500" thickness="4px" />
              <Text color="gray.500">Topluluk yükleniyor...</Text>
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
              Topluluk
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Sesimiz Ol topluluğunun aktif üyeleri ile tanışın, hikayelerini keşfedin
            </Text>
          </VStack>

          {/* Stats */}
          <Box bg={cardBgColor} borderRadius="lg" p={6} shadow="sm">
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
              <Stat textAlign="center">
                <StatNumber color="accent.600" fontSize="2xl">
                  {stats.totalUsers?.toLocaleString()}
                </StatNumber>
                <StatLabel fontSize="sm">Toplam Üye</StatLabel>
              </Stat>
              
              <Stat textAlign="center">
                <StatNumber color="green.500" fontSize="2xl">
                  {stats.activeUsers?.toLocaleString()}
                </StatNumber>
                <StatLabel fontSize="sm">Aktif Üye</StatLabel>
              </Stat>
              
              <Stat textAlign="center">
                <StatNumber color="blue.500" fontSize="2xl">
                  {stats.newThisMonth?.toLocaleString()}
                </StatNumber>
                <StatLabel fontSize="sm">Bu Ay Yeni</StatLabel>
              </Stat>
              
              <Stat textAlign="center">
                <StatNumber color="purple.500" fontSize="2xl">
                  {stats.totalStories?.toLocaleString()}
                </StatNumber>
                <StatLabel fontSize="sm">Toplam Hikaye</StatLabel>
              </Stat>
              
              <Stat textAlign="center">
                <StatNumber color="orange.500" fontSize="2xl">
                  {stats.totalComments?.toLocaleString()}
                </StatNumber>
                <StatLabel fontSize="sm">Toplam Yorum</StatLabel>
              </Stat>
            </SimpleGrid>
          </Box>

          {/* Filters */}
          <HStack spacing={4} maxW="2xl" mx="auto" w="full">
            <InputGroup flex={2}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Kullanıcı adı veya bio ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderColor="gray.200"
                _hover={{ borderColor: "gray.300" }}
                _focus={{ borderColor: "accent.500", boxShadow: "0 0 0 1px var(--chakra-colors-accent-500)" }}
              />
            </InputGroup>
            
            <Select 
              placeholder="Tüm Roller"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              bg="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
              maxW="200px"
            >
              <option value="USER">Kullanıcılar</option>
              <option value="ORGANIZATION">STK Temsilcileri</option>
              <option value="ADMIN">Adminler</option>
            </Select>
          </HStack>

          {/* Results Count */}
          <Text textAlign="center" color="gray.600">
            {filteredUsers.length} üye listeleniyor
          </Text>

          {/* Users Grid */}
          {filteredUsers.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </SimpleGrid>
          ) : (
            <Center py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  Arama kriterlerinize uygun üye bulunamadı
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

export default CommunityPage
