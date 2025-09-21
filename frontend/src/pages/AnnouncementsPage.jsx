import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Select,
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import AnnouncementCard from '../components/announcements/AnnouncementCard'

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')

  const bgColor = useColorModeValue('gray.50', 'gray.900')

  // Mock data for MVP
  const mockAnnouncements = [
    {
      id: 1,
      title: 'Yeni STK Kayıt Sistemi Aktif!',
      content: 'STK\'lar artık platforma daha kolay kayıt olabilir. Yeni kayıt sistemi ile STK\'lar bilgilerini daha detaylı şekilde ekleyebilir ve profillerini zenginleştirebilir. Sistem tamamen kullanıcı dostu olarak tasarlandı.',
      type: 'GENERAL',
      status: 'SENT',
      recipientCount: 2450,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: 2,
      title: 'Platform Bakım Duyurusu',
      content: 'Bu Pazar günü 02:00-04:00 saatleri arasında sistem bakımı yapılacaktır. Bu süre zarfında platforma erişim sağlanamayabilir. Anlayışınız için teşekkür ederiz.',
      type: 'USER',
      status: 'SCHEDULED',
      recipientCount: 5200,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      id: 3,
      title: 'Hikaye Paylaşım Kuralları Güncellendi',
      content: 'Topluluk standartlarımızı korumak amacıyla hikaye paylaşım kuralları güncellenmiştir. Lütfen yeni kuralları okuyarak hikayelerinizi bu kurallara uygun şekilde paylaşın.',
      type: 'USER',
      status: 'SENT',
      recipientCount: 5200,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
    },
    {
      id: 4,
      title: 'STK Profil Doğrulama Süreci',
      content: 'STK profillerinin doğrulanması için gerekli belgeler ve süreç hakkında detaylı bilgi. Doğrulanan profiller daha fazla özelliğe erişim sağlayabilecek.',
      type: 'ORGANIZATION',
      status: 'SENT',
      recipientCount: 150,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    },
    {
      id: 5,
      title: 'Yeni Özellikler ve İyileştirmeler',
      content: 'Platform\'a eklenen yeni özellikler: gelişmiş arama, kategori filtreleme, mobil uygulama iyileştirmeleri ve daha fazlası. Detaylar için blog sayfamızı ziyaret edin.',
      type: 'GENERAL',
      status: 'SENT',
      recipientCount: 7800,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
    },
    {
      id: 6,
      title: 'Topluluk Etkinliği: Online Buluşma',
      content: 'Bu ayın sonunda düzenlenecek online topluluk buluşması için kayıtlar başladı. Etkinlikte STK temsilcileri ve aktif kullanıcılar bir araya gelecek.',
      type: 'GENERAL',
      status: 'SENT',
      recipientCount: 3200,
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() // 3 weeks ago
    }
  ]

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAnnouncements(mockAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (err) {
        setError('Duyurular yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  // Filter announcements based on type
  const filteredAnnouncements = announcements.filter(ann => {
    return typeFilter === '' || ann.type === typeFilter
  })

  const getTypeCount = (type) => {
    return announcements.filter(ann => ann.type === type).length
  }

  // Group announcements by month
  const groupedAnnouncements = filteredAnnouncements.reduce((groups, announcement) => {
    const date = new Date(announcement.createdAt)
    const monthYear = date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(announcement)
    return groups
  }, {})

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="accent.500" thickness="4px" />
              <Text color="gray.500">Duyurular yükleniyor...</Text>
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
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <Heading size="xl" color="accent.600">
              Duyurular
            </Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Platform güncellemeleri, önemli duyurular ve topluluk haberlerini takip edin
            </Text>
          </VStack>

          {/* Stats */}
          <HStack spacing={4} justify="center" flexWrap="wrap">
            <Badge colorScheme="blue" px={3} py={1} fontSize="sm">
              {getTypeCount('GENERAL')} Genel
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} fontSize="sm">
              {getTypeCount('USER')} Kullanıcı
            </Badge>
            <Badge colorScheme="teal" px={3} py={1} fontSize="sm">
              {getTypeCount('ORGANIZATION')} STK
            </Badge>
          </HStack>

          {/* Filter */}
          <HStack spacing={4} maxW="md" mx="auto" w="full">
            <Select 
              placeholder="Tüm Duyurular"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              bg="white"
              borderColor="gray.200"
              _hover={{ borderColor: "gray.300" }}
            >
              <option value="GENERAL">Genel Duyurular</option>
              <option value="USER">Kullanıcı Duyuruları</option>
              <option value="ORGANIZATION">STK Duyuruları</option>
            </Select>
          </HStack>

          {/* Results Count */}
          <Text textAlign="center" color="gray.600">
            {filteredAnnouncements.length} duyuru listeleniyor
          </Text>

          {/* Announcements Timeline */}
          {Object.keys(groupedAnnouncements).length > 0 ? (
            <VStack spacing={8} align="stretch">
              {Object.entries(groupedAnnouncements).map(([monthYear, monthAnnouncements]) => (
                <VStack key={monthYear} spacing={4} align="stretch">
                  {/* Month Header */}
                  <Box position="relative">
                    <Heading 
                      size="md" 
                      color="accent.600" 
                      textAlign="center"
                      bg={bgColor}
                      px={4}
                      position="relative"
                      zIndex={1}
                    >
                      {monthYear}
                    </Heading>
                    <Box
                      position="absolute"
                      top="50%"
                      left="0"
                      right="0"
                      height="1px"
                      bg="gray.300"
                      zIndex={0}
                    />
                  </Box>

                  {/* Month Announcements */}
                  <VStack spacing={4} align="stretch">
                    {monthAnnouncements.map((announcement) => (
                      <AnnouncementCard key={announcement.id} announcement={announcement} />
                    ))}
                  </VStack>
                </VStack>
              ))}
            </VStack>
          ) : (
            <Center py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  Seçilen kriterlere uygun duyuru bulunamadı
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Farklı filtre seçeneklerini deneyebilirsiniz
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default AnnouncementsPage
