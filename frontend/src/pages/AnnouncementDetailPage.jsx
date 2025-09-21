import { useState, useEffect } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Icon,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import {
  FiCalendar,
  FiUsers,
  FiChevronRight
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const AnnouncementDetailPage = () => {
  const { id } = useParams()
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Mock data for MVP
  const mockAnnouncements = {
    '1': {
      id: 1,
      title: 'Yeni STK Kayıt Sistemi Aktif!',
      content: `STK'lar artık platforma daha kolay kayıt olabilir. Yeni kayıt sistemi ile STK'lar bilgilerini daha detaylı şekilde ekleyebilir ve profillerini zenginleştirebilir.

## Yeni Özellikler

**Gelişmiş Profil Yönetimi**
- Detaylı STK bilgileri
- Logo ve görsel yükleme
- Faaliyet alanları seçimi
- İletişim bilgileri yönetimi

**Doğrulama Sistemi**
- Otomatik belge kontrolü
- Hızlı onay süreci
- Doğrulanmış rozet sistemi

**Gelişmiş Arama**
- Kategori bazlı filtreleme
- Konum bazlı arama
- Faaliyet alanına göre listeleme

## Nasıl Başlayabilirsiniz?

1. **Kayıt Olun**: Ana sayfadaki "STK Kaydı" butonuna tıklayın
2. **Bilgileri Doldurun**: Gerekli tüm bilgileri eksiksiz doldurun
3. **Belgeleri Yükleyin**: STK belgelerinizi sisteme yükleyin
4. **Onay Bekleyin**: Doğrulama süreci 2-3 iş günü sürmektedir

Herhangi bir sorunuz olursa destek ekibimizle iletişime geçebilirsiniz.`,
      type: 'GENERAL',
      status: 'SENT',
      recipientCount: 2450,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    '2': {
      id: 2,
      title: 'Platform Bakım Duyurusu',
      content: `Bu Pazar günü 02:00-04:00 saatleri arasında sistem bakımı yapılacaktır.

## Bakım Detayları

**Tarih ve Saat**
- Pazar, 24 Mart 2024
- 02:00 - 04:00 (Türkiye Saati)

**Etkilenecek Sistemler**
- Ana platform
- Mobil uygulama
- API servisleri
- E-posta bildirimleri

## Bakım Sürecinde

Bu süre zarfında:
- Platforma erişim sağlanamayabilir
- Yeni hikaye paylaşımları yapılamaz
- Mesajlaşma sistemi çalışmayabilir
- Bildirimler gecikmeli gelebilir

## Alternatif İletişim

Acil durumlarda:
- E-posta: destek@sesimizol.com
- Telefon: 0850 555 0123

Anlayışınız için teşekkür ederiz.`,
      type: 'USER',
      status: 'SCHEDULED',
      recipientCount: 5200,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const announcementData = mockAnnouncements[id]
        if (announcementData) {
          setAnnouncement(announcementData)
        } else {
          setError('Duyuru bulunamadı.')
        }
      } catch (err) {
        setError('Duyuru yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAnnouncement()
    }
  }, [id])

  const getTypeColor = (type) => {
    const colors = {
      GENERAL: 'blue',
      USER: 'purple',
      ORGANIZATION: 'teal',
      ADMIN: 'orange'
    }
    return colors[type] || 'blue'
  }

  const getTypeLabel = (type) => {
    const labels = {
      GENERAL: 'Genel',
      USER: 'Kullanıcılar',
      ORGANIZATION: 'STK\'lar',
      ADMIN: 'Adminler'
    }
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: tr
      })
    } catch {
      return ''
    }
  }

  const formatContent = (content) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <Heading key={index} size="md" mt={6} mb={3} color="accent.600">
            {line.replace('## ', '')}
          </Heading>
        )
      }
      
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} fontWeight="bold" mb={2}>
            {line.replace(/\*\*/g, '')}
          </Text>
        )
      }
      
      if (line.startsWith('- ')) {
        return (
          <HStack key={index} spacing={2} align="start" mb={1}>
            <Box w={2} h={2} bg="accent.500" borderRadius="full" mt={2} />
            <Text>{line.replace('- ', '')}</Text>
          </HStack>
        )
      }
      
      if (line.match(/^\d+\./)) {
        return (
          <HStack key={index} spacing={2} align="start" mb={1}>
            <Text fontWeight="semibold" color="accent.500">
              {line.match(/^\d+/)[0]}.
            </Text>
            <Text>{line.replace(/^\d+\.\s*/, '')}</Text>
          </HStack>
        )
      }
      
      if (line.trim() === '') {
        return <Box key={index} h={2} />
      }
      
      return (
        <Text key={index} mb={2} lineHeight="tall">
          {line}
        </Text>
      )
    })
  }

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="accent.500" thickness="4px" />
              <Text color="gray.500">Duyuru yükleniyor...</Text>
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
          {/* Breadcrumb */}
          <Breadcrumb spacing="8px" separator={<FiChevronRight color="gray.500" />}>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/">Ana Sayfa</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/duyurular">Duyurular</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{announcement.title}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Article */}
          <Box bg={cardBgColor} borderRadius="xl" p={8} borderWidth="1px" borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="start" flexWrap="wrap">
                  <Badge colorScheme={getTypeColor(announcement.type)} size="lg">
                    {getTypeLabel(announcement.type)}
                  </Badge>
                  
                  {announcement.status === 'SENT' && (
                    <Badge colorScheme="green" size="lg" variant="subtle">
                      Gönderildi
                    </Badge>
                  )}
                  
                  {announcement.status === 'SCHEDULED' && (
                    <Badge colorScheme="yellow" size="lg" variant="subtle">
                      Zamanlandı
                    </Badge>
                  )}
                </HStack>

                <Heading size="xl" color="accent.600" lineHeight="shorter">
                  {announcement.title}
                </Heading>

                <HStack spacing={6} color="gray.500" fontSize="sm" flexWrap="wrap">
                  <HStack spacing={2}>
                    <Icon as={FiCalendar} />
                    <Text>{formatDate(announcement.createdAt)}</Text>
                  </HStack>
                  
                  <HStack spacing={2}>
                    <Icon as={FiUsers} />
                    <Text>{announcement.recipientCount?.toLocaleString()} kişiye gönderildi</Text>
                  </HStack>
                </HStack>
              </VStack>

              <Divider />

              {/* Content */}
              <VStack spacing={4} align="stretch">
                {formatContent(announcement.content)}
              </VStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default AnnouncementDetailPage
