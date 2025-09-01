import {
  Container,
  VStack,
  HStack,
  Box,
  Avatar,
  Text,
  Heading,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Button,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useDisclosure
} from '@chakra-ui/react'
import { 
  EditIcon, 
  CalendarIcon, 
  ChatIcon, 
  StarIcon,
  ViewIcon 
} from '@chakra-ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuth } from '../../contexts/AuthContext'
import ProfileSettings from './ProfileSettings'

const UserProfile = ({ userId = null }) => {
  const { user, isAuthenticated } = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  // Mock user data - in real app this would come from API
  const profileUser = user || {
    id: userId || 'demo-user',
    nickname: 'DemoUser',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isAnonymous: true,
    stats: {
      storiesShared: 3,
      commentsPosted: 12,
      storiesRead: 45,
      supportReceived: 28
    }
  }

  const joinDate = new Date(profileUser.joinedAt)
  const memberSince = formatDistanceToNow(joinDate, { 
    addSuffix: true, 
    locale: tr 
  })

  const isOwnProfile = isAuthenticated && user?.id === profileUser.id

  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={12} align="stretch">
        {/* Profile Header */}
        <Box textAlign="center">
          <VStack spacing={6}>
            <VStack spacing={4}>
              <Avatar 
                size="2xl" 
                name={profileUser.nickname}
                bg="brand.100"
                color="brand.500"
                fontSize="2xl"
                fontWeight="bold"
              />
              
              <VStack spacing={2}>
                <HStack spacing={3} align="center">
                  <Heading as="h1" size="xl" color="neutral.800">
                    @{profileUser.nickname}
                  </Heading>
                  {profileUser.isAnonymous && (
                    <Badge 
                      colorScheme="accent" 
                      variant="subtle"
                      px={3}
                      py={1}
                    >
                      Anonim Üye
                    </Badge>
                  )}
                </HStack>
                
                <HStack spacing={2} color="neutral.500">
                  <Icon as={CalendarIcon} boxSize={4} />
                  <Text fontSize="sm">
                    {memberSince} katıldı
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            {isOwnProfile && (
              <Button
                leftIcon={<EditIcon />}
                colorScheme="accent"
                variant="outline"
                size="sm"
                onClick={onOpen}
              >
                Profili Düzenle
              </Button>
            )}
          </VStack>
        </Box>

        {/* Profile Stats */}
        <Box>
          <VStack spacing={6}>
            <Heading as="h2" size="lg" color="neutral.800" textAlign="center">
              Platform İstatistikleri
            </Heading>
            
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="full">
              <Card variant="outline" borderColor="neutral.200">
                <CardBody textAlign="center" py={6}>
                  <Stat>
                    <StatLabel color="neutral.600" fontSize="sm">
                      Paylaştığı Hikâye
                    </StatLabel>
                    <StatNumber 
                      color="brand.500" 
                      fontSize="2xl" 
                      fontWeight="bold"
                    >
                      {profileUser.stats.storiesShared}
                    </StatNumber>
                    <StatHelpText color="neutral.500" fontSize="xs">
                      Güçlü sesler
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card variant="outline" borderColor="neutral.200">
                <CardBody textAlign="center" py={6}>
                  <Stat>
                    <StatLabel color="neutral.600" fontSize="sm">
                      Yazdığı Yorum
                    </StatLabel>
                    <StatNumber 
                      color="accent.500" 
                      fontSize="2xl" 
                      fontWeight="bold"
                    >
                      {profileUser.stats.commentsPosted}
                    </StatNumber>
                    <StatHelpText color="neutral.500" fontSize="xs">
                      Destek mesajları
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card variant="outline" borderColor="neutral.200">
                <CardBody textAlign="center" py={6}>
                  <Stat>
                    <StatLabel color="neutral.600" fontSize="sm">
                      Okuduğu Hikâye
                    </StatLabel>
                    <StatNumber 
                      color="orange.500" 
                      fontSize="2xl" 
                      fontWeight="bold"
                    >
                      {profileUser.stats.storiesRead}
                    </StatNumber>
                    <StatHelpText color="neutral.500" fontSize="xs">
                      Dinlediği sesler
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card variant="outline" borderColor="neutral.200">
                <CardBody textAlign="center" py={6}>
                  <Stat>
                    <StatLabel color="neutral.600" fontSize="sm">
                      Aldığı Destek
                    </StatLabel>
                    <StatNumber 
                      color="green.500" 
                      fontSize="2xl" 
                      fontWeight="bold"
                    >
                      {profileUser.stats.supportReceived}
                    </StatNumber>
                    <StatHelpText color="neutral.500" fontSize="xs">
                      Yakınlık bağları
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </Box>

        <Divider borderColor="neutral.300" />

        {/* Recent Activity Preview */}
        <Box>
          <VStack spacing={6}>
            <Heading as="h3" size="lg" color="neutral.800" textAlign="center">
              Son Aktiviteler
            </Heading>
            
            <VStack spacing={4} w="full" maxW="2xl" mx="auto">
              <Box 
                w="full" 
                p={6} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="neutral.200"
                bg="neutral.50"
              >
                <HStack spacing={4}>
                  <Icon as={ChatIcon} color="accent.500" boxSize={5} />
                  <VStack align="start" flex="1" spacing={1}>
                    <Text fontWeight="medium" color="neutral.800">
                      "Güçlü Kadınlar" hikayesine yorum yaptı
                    </Text>
                    <Text fontSize="sm" color="neutral.500">
                      2 saat önce
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Box 
                w="full" 
                p={6} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="neutral.200"
                bg="neutral.50"
              >
                <HStack spacing={4}>
                  <Icon as={ViewIcon} color="orange.500" boxSize={5} />
                  <VStack align="start" flex="1" spacing={1}>
                    <Text fontWeight="medium" color="neutral.800">
                      "Yeni Başlangıçlar" hikayesini okudu
                    </Text>
                    <Text fontSize="sm" color="neutral.500">
                      1 gün önce
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Box 
                w="full" 
                p={6} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="neutral.200"
                bg="brand.50"
              >
                <HStack spacing={4}>
                  <Icon as={StarIcon} color="brand.500" boxSize={5} />
                  <VStack align="start" flex="1" spacing={1}>
                    <Text fontWeight="medium" color="neutral.800">
                      "Benim Hikayem" adlı yeni hikayesini paylaştı
                    </Text>
                    <Text fontSize="sm" color="neutral.500">
                      3 gün önce
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        </Box>

        {/* Community Impact */}
        <Box bg="gradient(to-r, accent.50, brand.50)" p={8} borderRadius="lg">
          <VStack spacing={4} textAlign="center">
            <Heading as="h3" size="lg" color="neutral.800">
              Topluluk Etkisi
            </Heading>
            <Text fontSize="lg" color="neutral.600" maxW="2xl" lineHeight="tall">
              **@{profileUser.nickname}** platformda {profileUser.stats.storiesShared} hikaye paylaşarak 
              diğer kadınlara cesaret verdi ve {profileUser.stats.commentsPosted} destekleyici yorum yazarak 
              topluluk bağlarını güçlendirdi.
            </Text>
            <Text fontSize="sm" color="neutral.500">
              Her paylaşım ve yorum, başka bir kadının sesini duyurmaya cesaret vermektedir. 💜
            </Text>
          </VStack>
        </Box>

        {/* Profile Actions */}
        <VStack spacing={4} textAlign="center">
          <Text fontSize="lg" color="neutral.600">
            Hikayeler keşfetmeye devam et
          </Text>
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button 
              variant="outline" 
              colorScheme="gray"
              as="a"
              href="/"
            >
              Ana Sayfaya Dön
            </Button>
            <Button 
              colorScheme="brand" 
              as="a"
              href="/hikayeler"
            >
              Hikâyeleri Keşfet
            </Button>
            {isOwnProfile && (
              <Button 
                colorScheme="accent" 
                as="a"
                href="/hikaye-olustur"
              >
                Yeni Hikâye Paylaş
              </Button>
            )}
          </HStack>
        </VStack>
      </VStack>

      {/* Profile Settings Modal */}
      <ProfileSettings 
        isOpen={isOpen} 
        onClose={onClose} 
        user={profileUser}
      />
    </Container>
  )
}

export default UserProfile