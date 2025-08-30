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
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { storyAPI, userAPI } from '../services/api'

const StoryCreatePage = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    avatar: '',
    title: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  
  const toast = useToast()
  const navigate = useNavigate()

  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Takma ad gereklidir'
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = 'Takma ad en az 2 karakter olmalıdır'
    } else if (formData.nickname.length > 50) {
      newErrors.nickname = 'Takma ad en fazla 50 karakter olabilir'
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Başlık en az 5 karakter olmalıdır'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Başlık en fazla 200 karakter olabilir'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Hikâye içeriği gereklidir'
    } else if (formData.content.length < 50) {
      newErrors.content = 'Hikâye en az 50 karakter olmalıdır'
    } else if (formData.content.length > 10000) {
      newErrors.content = 'Hikâye en fazla 10.000 karakter olabilir'
    }
    
    if (formData.avatar && !isValidUrl(formData.avatar)) {
      newErrors.avatar = 'Geçerli bir URL giriniz'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // First create/get user
      let user
      try {
        user = await userAPI.create({
          nickname: formData.nickname.trim(),
          avatar: formData.avatar.trim() || undefined
        })
      } catch (userError) {
        // If nickname exists, this is expected behavior
        // In a real app, we'd handle user authentication properly
        throw new Error('Bu takma ad zaten kullanılıyor. Farklı bir takma ad deneyin.')
      }

      // Then create story
      const story = await storyAPI.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        authorId: user.data.id
      })

      toast({
        title: 'Başarılı!',
        description: 'Hikâyen başarıyla paylaşıldı.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Redirect to story detail page
      navigate(`/hikayeler/${story.data.id}`)
      
    } catch (error) {
      toast({
        title: 'Hata oluştu',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Back Button */}
        <Box>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            colorScheme="brand"
            as={RouterLink}
            to="/"
            size="sm"
          >
            Ana Sayfaya Dön
          </Button>
        </Box>

        {/* Page Header */}
        <VStack spacing={4} textAlign="center">
          <Heading as="h1" size="xl" color="brand.500">
            Hikâyeni Paylaş
          </Heading>
          <Text color="gray.600" maxW="lg">
            Hikâyen tamamen anonim olacak. Sadece seçeceğin takma isim görünecek.
          </Text>
        </VStack>

        {/* Privacy Notice */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="bold" fontSize="sm">
              Gizlilik Güvencesi
            </Text>
            <Text fontSize="sm">
              Kişisel bilgilerin alınmaz. Sadece takma isim ile hikâye paylaşırsın.
              Kimliğin gizli kalır ve hiçbir şekilde paylaşılmaz.
            </Text>
          </VStack>
        </Alert>

        {/* Story Form */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              {/* Nickname Field */}
              <FormControl isRequired isInvalid={!!errors.nickname}>
                <FormLabel>Takma Adın</FormLabel>
                <Input 
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  placeholder="Örnek: GizliYazar, AnonimSes, BenimHikayem"
                  size="lg"
                />
                {errors.nickname ? (
                  <FormErrorMessage>{errors.nickname}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Sadece sen bileceksin. Gerçek adın asla paylaşılmayacak.
                  </FormHelperText>
                )}
              </FormControl>

              {/* Avatar Field (Optional) */}
              <FormControl isInvalid={!!errors.avatar}>
                <FormLabel>Avatar (Opsiyonel)</FormLabel>
                <Input 
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  size="lg"
                />
                {errors.avatar ? (
                  <FormErrorMessage>{errors.avatar}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    İsteğe bağlı. Profil resmi URL'si ekleyebilirsin.
                  </FormHelperText>
                )}
              </FormControl>

              {/* Title Field */}
              <FormControl isRequired isInvalid={!!errors.title}>
                <FormLabel>Hikâye Başlığı</FormLabel>
                <Input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Hikâyen için çekici bir başlık seç"
                  size="lg"
                />
                {errors.title ? (
                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    {formData.title.length}/200 karakter
                  </FormHelperText>
                )}
              </FormControl>

              {/* Content Field */}
              <FormControl isRequired isInvalid={!!errors.content}>
                <FormLabel>Hikâyeni Anlat</FormLabel>
                <Textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Hikâyeni burada paylaş. Yaşadıklarını, düşüncelerini, deneyimlerini özgürce anlat..."
                  minHeight="300px"
                  resize="vertical"
                  size="lg"
                />
                {errors.content ? (
                  <FormErrorMessage>{errors.content}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    {formData.content.length}/10.000 karakter. En az 50 karakter gerekli.
                  </FormHelperText>
                )}
              </FormControl>

              {/* Submit Buttons */}
              <HStack spacing={4} justify="flex-end" pt={4}>
                <Button 
                  variant="outline" 
                  colorScheme="gray"
                  as={RouterLink}
                  to="/"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="brand" 
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Paylaşılıyor..."
                  px={8}
                >
                  Hikâyemi Paylaş
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>

        {/* Additional Info */}
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">
            Hikâyen paylaşıldıktan sonra ana sayfada görünecek ve diğer kullanıcılar okuyabilecek.
          </Text>
        </Alert>
      </VStack>
    </Container>
  )
}

export default StoryCreatePage