import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Divider,
  Button,
  HStack,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Link
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { PhoneIcon } from '@chakra-ui/icons'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const SupportPage = () => {
  const emergencyNumbers = [
    {
      name: 'ALO 183 Aile Danışma Hattı',
      number: '183',
      description: '7/24 aile danışmanlığı ve kadın destek hattı'
    },
    {
      name: 'Mor Çatı Kadın Danışma Merkezi', 
      number: '0212 292 52 31',
      description: 'Kadına yönelik şiddet danışma hattı'
    },
    {
      name: 'Kadın Dayanışma Vakfı',
      number: '0212 256 13 59', 
      description: 'Hukuki ve psikolojik destek hattı'
    },
    {
      name: 'İntihara Müdahale Hattı',
      number: '182',
      description: '7/24 kriz müdahale ve psikolojik destek'
    }
  ]

  const faqs = [
    {
      question: "Hikâyemi anonim olarak paylaşabilir miyim?",
      answer: "Evet! Platformumuzda sadece takma isim kullanıyorsunuz. Gerçek isminizi, telefon numaranızı ya da adresinizi asla talep etmiyoruz. Tüm hikâyeler tamamen anonimdir."
    },
    {
      question: "Paylaştığım hikâyeyi daha sonra silebilir miyim?",
      answer: "Tabii ki! Hesabınıza giriş yaparak paylaştığınız hikâyeleri istediğiniz zaman düzenleyebilir veya tamamen silebilirsiniz. Bu tamamen sizin kontrolünüzdedir."
    },
    {
      question: "Bilgilerim güvende mi?",
      answer: "Evet, tüm verileriniz SSL şifreleme ile korunur. KVKK'ya uygun olarak çalışıyoruz ve bilgilerinizi asla 3. taraflarla paylaşmıyoruz. Minimal veri toplama prensibiyle hareket ediyoruz."
    },
    {
      question: "Kötü içerikli hikâyeler nasıl kontrol ediliyor?",
      answer: "Topluluk raporlama sistemi ve içerik moderasyonu ile uygunsuz içerikleri tespit ediyoruz. Şiddet, nefret söylemi veya taciz içeren hikâyeler kaldırılır."
    },
    {
      question: "Hesabımı nasıl kapatırım?",
      answer: "Hesap kapatma talebinizi destek@sesimizol.com adresine gönderebilirsiniz. 48 saat içinde tüm verilerinizi kalıcı olarak sileriz."
    }
  ]

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <ProgressiveLoader delay={200} type="fade">
          <VStack spacing={4} textAlign="center">
          <Heading as="h1" size="xl" color="neutral.800">
            Destek Merkezi
          </Heading>
          <Text fontSize="lg" color="neutral.600" maxW="2xl">
            Size yardımcı olmak için buradayız. Platform kullanımı ve acil durumlarda 
            ihtiyaç duyacağınız tüm bilgiler aşağıda yer alıyor.
          </Text>
          </VStack>
        </ProgressiveLoader>

        {/* Emergency Alert */}
        <ProgressiveLoader delay={400} type="fade">
          <Alert 
            status="warning" 
            borderRadius="lg" 
            py={4}
            bg="accent.50"
            borderColor="accent.200"
            borderWidth="1px"
          >
            <AlertIcon color="accent.500" />
            <VStack align="start" spacing={2} flex="1">
              <Text fontWeight="bold" color="accent.700">
                Acil Durum!
              </Text>
              <Text fontSize="sm" color="accent.600">
                Hayatınız tehlikede ise derhal <strong>112</strong>'yi arayın. 
                Şiddet yaşıyorsanız güvenli bir yerden aşağıdaki destek hatlarını kullanın.
              </Text>
            </VStack>
          </Alert>
        </ProgressiveLoader>

        {/* Emergency Numbers */}
        <ProgressiveLoader delay={600} type="fade">
          <Box bg="neutral.50" p={6} borderRadius="lg">
          <VStack spacing={4} align="start">
            <Heading as="h2" size="lg" color="neutral.800">
              Acil Destek Hatları
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              {emergencyNumbers.map((contact, index) => (
                <Box
                  key={index}
                  bg="white"
                  p={4}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="neutral.200"
                >
                  <VStack align="start" spacing={3}>
                    <Text fontWeight="bold" fontSize="sm" color="neutral.800">
                      {contact.name}
                    </Text>
                    <HStack>
                      <PhoneIcon boxSize={3} />
                      <Link
                        href={`tel:${contact.number}`}
                        color="accent.600"
                        fontWeight="bold"
                        fontSize="lg"
                        _hover={{ color: "accent.500" }}
                      >
                        {contact.number}
                      </Link>
                    </HStack>
                    <Text fontSize="xs" color="neutral.600">
                      {contact.description}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
          </Box>
        </ProgressiveLoader>

        {/* FAQ Section */}
        <ProgressiveLoader delay={800} type="fade">
          <Box bg="white" p={6} borderRadius="lg" borderWidth="1px" borderColor="neutral.200">
          <VStack spacing={4} align="start">
            <Heading as="h2" size="lg" color="neutral.800">
              Sık Sorulan Sorular
            </Heading>
            
            <Accordion allowToggle w="full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} borderColor="neutral.200">
                  <h2>
                    <AccordionButton py={4} _hover={{ bg: 'neutral.50' }}>
                      <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                        {faq.question}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} color="neutral.700">
                    {faq.answer}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </VStack>
          </Box>
        </ProgressiveLoader>

        {/* Community Guidelines */}
        <ProgressiveLoader delay={1000} type="fade">
          <Box bg="neutral.50" p={6} borderRadius="lg">
          <VStack spacing={4} align="start">
            <Heading as="h2" size="lg" color="neutral.800">
              Topluluk Kuralları
            </Heading>
            
            <Text color="neutral.700">
              "Sesimiz Ol" güvenli bir alan olarak kalması için bu kuralları takip ediyoruz:
            </Text>
            
            <List spacing={2}>
              <ListItem>
                <Text as="span" fontWeight="medium">Saygılı İletişim:</Text>
                <Text as="span" ml={2}>Birbirimize saygılı ve anlayışlı davranıyoruz</Text>
              </ListItem>
              
              <ListItem>
                <Text as="span" fontWeight="medium">Gizlilik:</Text>
                <Text as="span" ml={2}>Kimsenin kişisel bilgilerini paylaşmıyoruz</Text>
              </ListItem>
              
              <ListItem>
                <Text as="span" fontWeight="medium">Uygun İçerik:</Text>
                <Text as="span" ml={2}>Nefret söylemi, taciz veya şiddet içerikli paylaşım yapmıyoruz</Text>
              </ListItem>
              
              <ListItem>
                <Text as="span" fontWeight="medium">Destek:</Text>
                <Text as="span" ml={2}>Birbirimizi destekliyor, yargılamıyoruz</Text>
              </ListItem>
            </List>
            
            <Box bg="neutral.100" p={4} borderRadius="md" mt={4}>
              <Text fontSize="sm" color="neutral.700">
                Bu kurallara uymayan içerikleri <strong>bildirin</strong>. 
                Moderatörlerimiz 24 saat içinde değerlendirir.
              </Text>
            </Box>
          </VStack>
          </Box>
        </ProgressiveLoader>

        <Divider />

        {/* Back to Home */}
        <ProgressiveLoader delay={1200} type="fade">
          <VStack spacing={4} textAlign="center">
          <Text fontSize="sm" color="neutral.500">
            Aradığınız yanıtı bulamadınız mı?
          </Text>
          
          <HStack spacing={4}>
            <Button
              as={RouterLink}
              to="/"
              colorScheme="accent"
              variant="outline"
            >
              Ana Sayfa
            </Button>
            
            <Button
              as={RouterLink}
              to="/hikayeler"
              variant="ghost"
              color="neutral.600"
            >
              Hikâyeleri Görüntüle
            </Button>
          </HStack>
          </VStack>
        </ProgressiveLoader>
      </VStack>
    </Container>
  )
}

export default SupportPage