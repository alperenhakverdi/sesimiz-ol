import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  List,
  ListItem,
  ListIcon,
  Divider,
  Alert,
  AlertIcon,
  Button,
  useColorModeValue,
  Icon
} from '@chakra-ui/react'
import {
  FiShield,
  FiHeart,
  FiUsers,
  FiMessageCircle,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiFlag
} from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'

const CommunityGuidelinesPage = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const GuidelineSection = ({ icon, title, children, variant = 'default' }) => (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={variant === 'warning' ? 'red.200' : borderColor}
      borderLeft="4px solid"
      borderLeftColor={variant === 'warning' ? 'red.500' : 'brand.500'}
    >
      <HStack spacing={3} mb={4}>
        <Icon as={icon} boxSize={6} color={variant === 'warning' ? 'red.500' : 'brand.500'} />
        <Heading as="h3" size="md" color="neutral.800">
          {title}
        </Heading>
      </HStack>
      {children}
    </Box>
  )

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={4} align="start">
          <HStack spacing={3}>
            <FiShield size={28} color="var(--chakra-colors-brand-500)" />
            <Heading as="h1" size="xl" color="neutral.800">
              Topluluk Kuralları
            </Heading>
          </HStack>
          <Text fontSize="lg" color="neutral.600" lineHeight="tall">
            Sesimiz Ol, kadınların deneyimlerini güvenli bir şekilde paylaşabilecekleri,
            destekleyici ve saygılı bir topluluk oluşturmayı amaçlar. Bu kurallar,
            platformumuzu herkes için güvenli ve pozitif tutmak için tasarlanmıştır.
          </Text>
        </VStack>

        {/* Community Values */}
        <GuidelineSection icon={FiHeart} title="Topluluk Değerlerimiz">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              Sesimiz Ol topluluğu aşağıdaki değerler üzerine kuruludur:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                <Text as="span" fontWeight="medium">Güvenlik:</Text> Herkesin kendini güvende hissettiği bir ortam
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                <Text as="span" fontWeight="medium">Saygı:</Text> Farklı görüşlere ve deneyimlere saygı
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                <Text as="span" fontWeight="medium">Destek:</Text> Birbirimizi destekleyen ve güçlendiren bir topluluk
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                <Text as="span" fontWeight="medium">Özgünlük:</Text> Kendi hikayelerinizi gerçek ve samimi bir şekilde paylaşma
              </ListItem>
            </List>
          </VStack>
        </GuidelineSection>

        {/* Acceptable Behavior */}
        <GuidelineSection icon={FiUsers} title="Kabul Edilebilir Davranışlar">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              Toplululuğumuzda teşvik ettiğimiz davranışlar:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Yapıcı ve destekleyici yorumlar yapmak
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Farklı perspektiflere açık olmak ve empati göstermek
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Kişisel deneyimlerinizi samimi bir şekilde paylaşmak
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Diğer üyelere yardımcı olmak ve onları güçlendirmek
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Gizlilik ve mahremiyete saygı göstermek
              </ListItem>
            </List>
          </VStack>
        </GuidelineSection>

        {/* Unacceptable Behavior */}
        <GuidelineSection icon={FiAlertTriangle} title="Kabul Edilemez Davranışlar" variant="warning">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              Aşağıdaki davranışlar topluluk kurallarımıza aykırıdır ve hesap askıya alınmasına yol açabilir:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Taciz ve Zorbalık:</Text> Herhangi bir şekilde taciz, zorbalık veya tehdit
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Nefret Söylemi:</Text> Irkçılık, cinsiyetçilik, homofobi ve diğer ayrımcı dil
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Spam ve İstenmeyen İçerik:</Text> Tekrarlı, alakasız veya tanıtım amaçlı gönderiler
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Doxxing:</Text> Kişisel bilgileri izinsiz paylaşmak
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Sahte İçerik:</Text> Yanlış bilgi yaymak veya sahte hikayeler paylaşmak
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Uygunsuz İçerik:</Text> Açık cinsel içerik, şiddet veya yasal olmayan faaliyetler
              </ListItem>
            </List>
          </VStack>
        </GuidelineSection>

        {/* Content Guidelines */}
        <GuidelineSection icon={FiMessageCircle} title="İçerik Kuralları">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              Hikayeler ve yorumlar için özel kurallar:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                İçerikleriniz kendi deneyimlerinize dayanmalıdır
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Diğer insanların mahremiyetini koruyun (isim, adres vs. belirtmeyin)
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Tetikleyici içerik için uyarı ekleyin
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                Telif hakkı ihlali yapan içerik paylaşmayın
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                Diğer platformlardan kopyalanan içerik paylaşmayın
              </ListItem>
            </List>
          </VStack>
        </GuidelineSection>

        {/* Reporting */}
        <GuidelineSection icon={FiFlag} title="Şikayet ve Raporlama">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              Topluluk kurallarını ihlal eden davranışlarla karşılaştığınızda:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                İçeriği hemen raporlayın (yorumlarda "..." menüsünü kullanın)
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Mümkün olduğunca detaylı açıklama yapın
              </ListItem>
              <ListItem>
                <ListIcon as={FiCheck} color="green.500" />
                Ciddi durumlar için doğrudan bizimle iletişime geçin
              </ListItem>
            </List>

            <Alert status="info" mt={4}>
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium">Tüm şikayetler gizli olarak incelenir</Text>
                <Text fontSize="sm">
                  Şikayet eden kişinin kimliği gizli tutulur ve 24 saat içinde değerlendirme yapılır.
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </GuidelineSection>

        {/* Consequences */}
        <GuidelineSection icon={FiShield} title="Kural İhlali Sonuçları">
          <VStack spacing={4} align="start">
            <Text color="neutral.700">
              İhlal türüne göre uygulanan yaptırımlar:
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FiAlertTriangle} color="yellow.500" />
                <Text as="span" fontWeight="medium">İlk Uyarı:</Text> Hafif ihlaller için resmi uyarı
              </ListItem>
              <ListItem>
                <ListIcon as={FiAlertTriangle} color="orange.500" />
                <Text as="span" fontWeight="medium">Geçici Askıya Alma:</Text> 1-7 gün arası hesap askıya alınması
              </ListItem>
              <ListItem>
                <ListIcon as={FiX} color="red.500" />
                <Text as="span" fontWeight="medium">Kalıcı Hesap Kapatma:</Text> Ciddi ihlaller için kalıcı yasaklama
              </ListItem>
            </List>
          </VStack>
        </GuidelineSection>

        {/* Contact */}
        <Box textAlign="center" py={8}>
          <Text fontSize="lg" color="neutral.700" mb={4}>
            Sorularınız mı var? Yardıma mı ihtiyacınız var?
          </Text>
          <HStack spacing={4} justify="center">
            <Button
              as={RouterLink}
              to="/contact"
              colorScheme="brand"
              leftIcon={<FiMessageCircle />}
            >
              İletişime Geç
            </Button>
            <Button
              as={RouterLink}
              to="/help"
              variant="outline"
              colorScheme="brand"
            >
              Yardım Merkezi
            </Button>
          </HStack>
        </Box>

        <Divider />

        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="neutral.500">
            Bu kurallar son güncelleme: Eylül 2025 •
            <Text as="span" mx={2}>•</Text>
            Kurallarımız topluluk geri bildirimlerine göre güncellenebilir
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}

export default CommunityGuidelinesPage