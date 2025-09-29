import { useState } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  Icon,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiHelpCircle, FiMail, FiMessageSquare, FiBook } from 'react-icons/fi'

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const bgColor = useColorModeValue('neutral.50', 'neutral.900')
  const cardBgColor = useColorModeValue('white', 'neutral.800')
  const headingColor = useColorModeValue('primary.800', 'neutral.100')
  const descColor = useColorModeValue('neutral.600', 'neutral.300')
  const mutedColor = useColorModeValue('neutral.600', 'neutral.400')
  const hoverBg = useColorModeValue('neutral.100', 'neutral.700')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: 'Destek talebiniz alındı!',
        description: 'En kısa sürede size geri dönüş yapacağız.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      setFormData({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: ''
      })
      setIsSubmitting(false)
    }, 2000)
  }

  const faqData = [
    {
      question: 'Hesabımı nasıl oluştururum?',
      answer: 'Ana sayfadaki "Giriş Yap" butonuna tıklayarak giriş modalını açın. Modalın alt kısmındaki "Hesap oluştur" linkine tıklayarak kayıt formunu doldurun. Sadece takma isim ve şifre yeterlidir.'
    },
    {
      question: 'Hikayemi nasıl anonim tutarım?',
      answer: 'Tüm hikayeler varsayılan olarak anonimdir. Gerçek isminizi asla paylaşmıyoruz. Sadece seçtiğiniz takma isim görünür. Ek güvenlik için hikayenizde kişisel bilgiler paylaşmamaya özen gösterin.'
    },
    {
      question: 'Hikayemi yanlışlıkla paylaştım, silebilir miyim?',
      answer: 'Evet, kendi hikayelerinizi istediğiniz zaman silebilirsiniz. Hikaye sayfasında "Düzenle" veya "Sil" seçeneklerini kullanabilirsiniz. Silinen hikayeler kalıcı olarak sistemden kaldırılır.'
    },
    {
      question: 'Platformda zararlı içerik gördüm, ne yapmalıyım?',
      answer: 'Her hikaye ve yorunda "Şikayet Et" butonu bulunur. Bu butona tıklayarak zararlı içeriği bildirebilirsiniz. Moderasyon ekibimiz 24 saat içinde inceleme yapar.'
    },
    {
      question: 'STK olarak platforma nasıl katılırım?',
      answer: 'STK kayıt sistemi üzerinden başvuru yapabilirsiniz. Gerekli belgelerinizi yükledikten sonra doğrulama süreci 2-3 iş günü sürer. Onaylandıktan sonra STK profiliniz aktif olur.'
    },
    {
      question: 'Şifremi unuttum, ne yapmalıyım?',
      answer: 'Giriş modalında "Şifremi Unuttum" linkine tıklayın. Kayıt olurken kullandığınız e-posta adresini girin, size şifre sıfırlama linki gönderilecektir.'
    },
    {
      question: 'Mobil uygulamanız var mı?',
      answer: 'Şu anda mobil uygulamamız bulunmamakta, ancak web sitemiz mobil cihazlarda mükemmel çalışacak şekilde optimize edilmiştir. Mobil uygulama geliştirme sürecimiz devam etmektedir.'
    },
    {
      question: 'Verilerim güvende mi?',
      answer: 'Evet, verileriniz tamamen güvende. Minimum veri toplama politikası uyguluyoruz ve hiçbir kişisel bilginizi 3. taraflarla paylaşmıyoruz. Detaylar için Gizlilik Politikamızı inceleyebilirsiniz.'
    }
  ]

  const supportCategories = [
    { icon: FiHelpCircle, title: 'Genel Sorular', description: 'Platform kullanımı hakkında genel sorular' },
    { icon: FiMessageSquare, title: 'Teknik Sorunlar', description: 'Site erişimi, hata mesajları ve teknik problemler' },
    { icon: FiBook, title: 'Hesap Yönetimi', description: 'Giriş, kayıt, şifre ve profil sorunları' },
    { icon: FiMail, title: 'İçerik Moderasyonu', description: 'Zararlı içerik bildirimi ve topluluk kuralları' }
  ]

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={12} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="center" textAlign="center">
            <HStack spacing={3}>
              <Icon as={FiHelpCircle} boxSize={8} color="accent.500" />
              <Heading size="xl" color={headingColor}>
                Destek Merkezi
              </Heading>
            </HStack>
            <Text fontSize="lg" color={descColor} maxW="2xl">
              Size nasıl yardımcı olabiliriz? Sık sorulan soruları inceleyin veya bizimle iletişime geçin.
            </Text>
          </VStack>

          {/* Support Categories */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {supportCategories.map((category, index) => (
              <Box
                key={index}
                bg={cardBgColor}
                p={6}
                borderRadius="lg"
                shadow="sm"
                textAlign="center"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
              >
                <VStack spacing={3}>
                  <Icon as={category.icon} boxSize={8} color="accent.500" />
                  <Heading size="sm" color={headingColor}>{category.title}</Heading>
                  <Text fontSize="sm" color={descColor}>
                    {category.description}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          {/* FAQ Section */}
          <Box bg={cardBgColor} borderRadius="lg" p={8} shadow="sm">
            <VStack spacing={6} align="stretch">
              <Heading size="lg" textAlign="center" color={headingColor}>
                Sık Sorulan Sorular
              </Heading>
              
              <Accordion allowMultiple>
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} border="none">
                    <AccordionButton
                      py={4}
                      px={0}
                      _hover={{ bg: hoverBg }}
                      borderRadius="md"
                    >
                      <Box flex="1" textAlign="left">
                        <Text fontWeight="semibold" color={headingColor}>
                          {faq.question}
                        </Text>
                      </Box>
                      <AccordionIcon color="accent.500" />
                    </AccordionButton>
                    <AccordionPanel pb={4} px={0}>
                      <Text color={descColor} lineHeight="tall">
                        {faq.answer}
                      </Text>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </Box>

          {/* Contact Form */}
          <Box bg={cardBgColor} borderRadius="lg" p={8} shadow="sm">
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} textAlign="center">
                <Heading size="lg" color={headingColor}>
                  Bizimle İletişime Geçin
                </Heading>
                <Text color={descColor}>
                  Sorunuz FAQ'lerde yoksa, aşağıdaki formu doldurarak bize ulaşabilirsiniz
                </Text>
              </VStack>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>İsim</FormLabel>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Adınız"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>E-posta</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="ornek@email.com"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Kategori seçin"
                      >
                        <option value="general">Genel Sorular</option>
                        <option value="technical">Teknik Sorunlar</option>
                        <option value="account">Hesap Yönetimi</option>
                        <option value="content">İçerik Moderasyonu</option>
                        <option value="other">Diğer</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Konu</FormLabel>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Konu başlığı"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel>Mesaj</FormLabel>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Sorununuzu detaylı olarak açıklayın..."
                      rows={6}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="accent"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Gönderiliyor..."
                    w={{ base: 'full', md: 'auto' }}
                    px={8}
                  >
                    Mesaj Gönder
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>

          {/* Quick Links */}
          <Box textAlign="center">
            <VStack spacing={4}>
              <Text color={mutedColor}>
                Daha fazla bilgi için diğer sayfalarımızı ziyaret edebilirsiniz
              </Text>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button as={RouterLink} to="/gizlilik" variant="outline" size="sm">
                  Gizlilik Politikası
                </Button>
                <Button as={RouterLink} to="/hakkinda" variant="outline" size="sm">
                  Hakkımızda
                </Button>
                <Button as={RouterLink} to="/iletisim" variant="outline" size="sm">
                  İletişim
                </Button>
                <Button as={RouterLink} to="/topluluk" variant="outline" size="sm">
                  Topluluk
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default SupportPage