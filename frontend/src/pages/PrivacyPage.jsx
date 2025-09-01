import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  List,
  ListItem,
  Divider,
  Button,
  HStack,
  Icon,
  SimpleGrid,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { LockIcon, InfoIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const PrivacyPage = () => {
  return (
    <Container maxW="container.lg" py={12}>
      <VStack spacing={16} align="stretch">
        {/* Hero Section */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={6} textAlign="center">
          <HStack spacing={3} justify="center">
            <Icon as={LockIcon} boxSize={8} color="brand.500" />
            <Heading as="h1" size="2xl" color="neutral.800">
              Gizlilik Politikası
            </Heading>
          </HStack>
          
          <VStack spacing={4} maxW="3xl">
            <Text fontSize="xl" color="neutral.600" lineHeight="tall">
              <strong>Sesimiz Ol</strong> platformunda gizliliğiniz ve güvenliğiniz bizim en büyük önceliğimizdir.
            </Text>
            <Text fontSize="lg" color="neutral.500">
              Kişisel verilerinizi nasıl koruduğumuzu ve haklarınızı şeffaf bir şekilde açıklıyoruz.
            </Text>
          </VStack>
          
          <Alert status="success" borderRadius="lg" maxW="2xl">
            <AlertIcon />
            <VStack spacing={1} align="start" flex="1">
              <Text fontWeight="medium" color="green.700">
                Minimal Veri, Maksimum Güvenlik
              </Text>
              <Text fontSize="sm" color="green.600">
                Sadece platformun çalışması için gerekli minimum bilgileri topluyoruz.
              </Text>
            </VStack>
          </Alert>
          </VStack>
        </ProgressiveLoader>

        {/* Data Collection Section */}
        <ProgressiveLoader delay={400} type="fade">
          <VStack spacing={10} align="stretch">
          <VStack spacing={4} align="center" textAlign="center">
            <Icon as={InfoIcon} boxSize={6} color="brand.500" />
            <Heading as="h2" size="xl" color="neutral.800">
              Hangi Bilgileri Topluyoruz?
            </Heading>
            <Text fontSize="lg" color="neutral.600" maxW="2xl">
              Anonim ve güvenli bir deneyim sunabilmek için sadece gerekli minimum bilgileri toplarız.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="start">
            {/* What we collect */}
            <VStack spacing={6} align="start">
              <VStack spacing={3} align="start" w="full">
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Heading as="h3" size="lg" color="neutral.800">
                    Topladığımız Bilgiler
                  </Heading>
                </HStack>
                <Text color="neutral.600">
                  Platformun çalışması için gerekli olan minimum bilgiler:
                </Text>
              </VStack>

              <VStack spacing={4} align="start" pl={6}>
                <Box>
                  <Text fontWeight="bold" color="neutral.800" mb={2}>
                    📝 Takma İsim (Nickname)
                  </Text>
                  <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                    Hikaye paylaşımı ve yorum yapabilmeniz için seçtiğiniz kullanıcı adı. 
                    Gerçek isminizi asla soruyoruz.
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" color="neutral.800" mb={2}>
                    📖 Paylaştığınız İçerik
                  </Text>
                  <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                    Hikayeleriniz ve yorumlarınız. Bu içeriği kontrol etme ve silme hakkına sahipsiniz.
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" color="neutral.800" mb={2}>
                    📊 Anonim İstatistikler
                  </Text>
                  <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                    Platform performansını iyileştirmek için anonim kullanım verileri (kimliğinizle bağlantısız).
                  </Text>
                </Box>
              </VStack>
            </VStack>

            {/* What we don't collect */}
            <VStack spacing={6} align="start">
              <VStack spacing={3} align="start" w="full">
                <HStack>
                  <Icon as={WarningIcon} color="orange.500" />
                  <Heading as="h3" size="lg" color="neutral.800">
                    Toplamadığımız Bilgiler
                  </Heading>
                </HStack>
                <Text color="neutral.600">
                  Anonimliğinizi korumak için bu bilgileri asla istemeyiz:
                </Text>
              </VStack>

              <VStack spacing={4} align="start" pl={6}>
                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" color="neutral.800">
                    🚫 Kişisel Kimlik Bilgileri
                  </Text>
                  <List spacing={1} fontSize="sm" color="neutral.600">
                    <ListItem>• Gerçek isim ve soyisim</ListItem>
                    <ListItem>• Kimlik numarası</ListItem>
                    <ListItem>• Doğum tarihi</ListItem>
                    <ListItem>• Telefon numarası</ListItem>
                  </List>
                </VStack>

                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" color="neutral.800">
                    📍 Konum ve Adres
                  </Text>
                  <List spacing={1} fontSize="sm" color="neutral.600">
                    <ListItem>• Ev veya iş adresi</ListItem>
                    <ListItem>• GPS koordinatları</ListItem>
                    <ListItem>• IP adresi takibi</ListItem>
                  </List>
                </VStack>
              </VStack>
            </VStack>
          </SimpleGrid>
          </VStack>
        </ProgressiveLoader>

        <Divider borderColor="neutral.300" />

        {/* Data Usage Section */}
        <ProgressiveLoader delay={600} type="fade">
          <VStack spacing={8} align="stretch">
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h2" size="xl" color="neutral.800">
              Verilerinizi Nasıl Kullanıyoruz?
            </Heading>
            <Text fontSize="lg" color="neutral.600" maxW="2xl">
              Topladığımız bilgileri yalnızca platformun çalışması ve güvenliğiniz için kullanırız.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <VStack spacing={4} textAlign="center">
              <Box p={4} borderRadius="full" bg="accent.100">
                <Icon as={CheckCircleIcon} boxSize={8} color="accent.500" />
              </Box>
              <VStack spacing={2}>
                <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                  Platform İşletimi
                </Text>
                <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                  Hesabınızın yönetimi, hikaye paylaşımı ve yorum sistemi için kullanırız.
                </Text>
              </VStack>
            </VStack>

            <VStack spacing={4} textAlign="center">
              <Box p={4} borderRadius="full" bg="brand.100">
                <Icon as={LockIcon} boxSize={8} color="brand.500" />
              </Box>
              <VStack spacing={2}>
                <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                  Güvenlik
                </Text>
                <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                  Spam önleme, zararlı içerik tespiti ve platform güvenliği sağlamak için.
                </Text>
              </VStack>
            </VStack>

            <VStack spacing={4} textAlign="center">
              <Box p={4} borderRadius="full" bg="orange.100">
                <Icon as={InfoIcon} boxSize={8} color="orange.500" />
              </Box>
              <VStack spacing={2}>
                <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                  İyileştirme
                </Text>
                <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                  Anonim istatistiklerle platformu daha iyi hale getirmek için.
                </Text>
              </VStack>
            </VStack>
          </SimpleGrid>

          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <VStack spacing={1} align="start" flex="1">
              <Text fontWeight="bold" color="orange.700">
                Verilerinizi Asla Yapmadığımız Şeyler
              </Text>
              <Text fontSize="sm" color="orange.600">
                • 3. taraf şirketlere satmayız • Reklam amacıyla kullanmayız • 
                Kimliğinizi tespit etmeye çalışmayız • Başka sitelerle paylaşmayız
              </Text>
            </VStack>
          </Alert>
          </VStack>
        </ProgressiveLoader>

        <Divider borderColor="neutral.300" />

        {/* User Rights */}
        <ProgressiveLoader delay={800} type="fade">
          <VStack spacing={8} align="stretch">
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h2" size="xl" color="neutral.800">
              KVKK Haklarınız
            </Heading>
            <Text fontSize="lg" color="neutral.600" maxW="2xl">
              Kişisel Verilerin Korunması Kanunu kapsamında sahip olduğunuz haklar:
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack spacing={4} align="start" p={6} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
              <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                🔍 Erişim Hakkı
              </Text>
              <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                Hangi kişisel verilerinizin işlendiğini öğrenme, verilerin işlenme amacını ve nasıl kullanıldığını sorgulama hakkınız.
              </Text>
            </VStack>

            <VStack spacing={4} align="start" p={6} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
              <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                ✏️ Düzeltme Hakkı
              </Text>
              <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                Yanlış veya eksik olan kişisel verilerinizi düzeltme ve güncel tutma hakkınız.
              </Text>
            </VStack>

            <VStack spacing={4} align="start" p={6} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
              <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                🗑️ Silme Hakkı
              </Text>
              <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                Kişisel verilerinizin silinmesini isteme hakkınız. Hesabınızı tamamen kapatabilirsiniz.
              </Text>
            </VStack>

            <VStack spacing={4} align="start" p={6} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
              <Text fontWeight="bold" fontSize="lg" color="neutral.800">
                🚫 İtiraz Hakkı
              </Text>
              <Text fontSize="sm" color="neutral.600" lineHeight="tall">
                Veri işleme faaliyetlerine itiraz etme ve işlemenin durdurulmasını talep etme hakkınız.
              </Text>
            </VStack>
          </SimpleGrid>

          <Box textAlign="center" py={4}>
            <Button
              as={RouterLink}
              to="/iletisim"
              colorScheme="accent"
              size="lg"
            >
              Haklarımı Kullanmak İstiyorum
            </Button>
            <Text fontSize="sm" color="neutral.500" mt={2}>
              İletişim sayfası üzerinden talebinizi iletebilirsiniz
            </Text>
          </Box>
          </VStack>
        </ProgressiveLoader>

        <Divider borderColor="neutral.300" />

        {/* Footer */}
        <ProgressiveLoader delay={1000} type="fade">
          <VStack spacing={6} textAlign="center">
          <VStack spacing={2}>
            <Text fontSize="sm" color="neutral.500">
              <strong>Son güncellenme:</strong> 31 Ağustos 2025
            </Text>
            <Text fontSize="sm" color="neutral.600" maxW="lg" lineHeight="tall">
              Gizlilik politikamızda değişiklik yapılması durumunda, 
              bu sayfada güncellenmiş versiyonu yayınlayacağız.
            </Text>
          </VStack>
          
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button as={RouterLink} to="/" variant="outline" size="sm">
              Ana Sayfa
            </Button>
            <Button as={RouterLink} to="/hakkinda" variant="outline" size="sm">
              Hakkında
            </Button>
            <Button as={RouterLink} to="/destek" variant="outline" size="sm">
              Destek
            </Button>
            <Button as={RouterLink} to="/iletisim" variant="outline" size="sm">
              İletişim
            </Button>
          </HStack>
          </VStack>
        </ProgressiveLoader>
      </VStack>
    </Container>
  )
}

export default PrivacyPage