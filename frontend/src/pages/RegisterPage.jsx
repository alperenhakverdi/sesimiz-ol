import { useState, useRef } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  IconButton,
  Alert,
  AlertIcon,
  Avatar,
  Circle,
  Flex,
  useBreakpointValue,
  Link as ChakraLink,
  Divider,
  Stack,
  Badge,
  SimpleGrid
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { ViewIcon, ViewOffIcon, CloseIcon, AddIcon, EmailIcon, LockIcon, AtSignIcon } from '@chakra-ui/icons'
import { useAuth } from '../contexts/AuthContext'
import PageTransition from '../components/animations/PageTransition'
import AnimatedButton from '../components/animations/AnimatedButton'
import FadeIn from '../components/animations/FadeIn'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()
  const fileInputRef = useRef(null)
  
  // Responsive values
  const spacing = useBreakpointValue({ base: 6, md: 8 })
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' })

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz')
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Sadece JPEG, PNG ve WebP dosyaları kabul edilir')
    }
    
    return true
  }

  const compressImage = (file, maxSizeKB = 200) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions to keep aspect ratio
        const maxSize = 300 // Max width/height
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height)
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try different quality levels until under size limit
        let quality = 0.8
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob && blob.size <= maxSizeKB * 1024) {
              resolve(blob)
            } else if (quality > 0.1) {
              quality -= 0.1
              tryCompress()
            } else {
              resolve(blob) // Give up, return what we have
            }
          }, 'image/jpeg', quality)
        }
        tryCompress()
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file) => {
    try {
      validateFile(file)
      
      // Compress the image
      const compressedBlob = await compressImage(file, 200) // 200KB limit
      const compressedFile = new File([compressedBlob], file.name, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      })
      
      setAvatar(compressedFile)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(compressedFile)
      setError('')
    } catch (error) {
      setError(error.message)
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const removeAvatar = () => {
    setAvatar(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    if (!formData.nickname.trim()) {
      throw new Error('Kullanıcı adı gereklidir')
    }
    
    if (formData.nickname.trim().length < 2) {
      throw new Error('Kullanıcı adı en az 2 karakter olmalıdır')
    }
    
    if (formData.nickname.trim().length > 20) {
      throw new Error('Kullanıcı adı en fazla 20 karakter olmalıdır')
    }
    
    if (!/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/.test(formData.nickname.trim())) {
      throw new Error('Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir')
    }
    
    if (!formData.password) {
      throw new Error('Şifre gereklidir')
    }
    
    if (formData.password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır')
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      throw new Error('Şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
    }
    
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Şifreler eşleşmiyor')
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      throw new Error('Geçerli bir email adresi giriniz')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      validateForm()
      
      const registrationData = {
        nickname: formData.nickname.trim(),
        password: formData.password,
        email: formData.email.trim() || undefined,
        avatar: avatar
      }
      
      await register(registrationData)
      navigate('/')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <PageTransition>
      <Box 
        minH="100vh" 
        bg="neutral.50"
        py={8}
        px={4}
      >
        <Container maxW="full" px={{ base: 6, md: 8, lg: 12 }} centerContent>
          <FadeIn>
            <VStack spacing={spacing} w="full" maxW={{ base: "full", md: "2xl", lg: "3xl" }}>
              {/* Header */}
              <VStack spacing={4} textAlign="center">
                <Circle size="60px" bg="accent.100">
                  <AtSignIcon boxSize={6} color="accent.600" />
                </Circle>
                
                <Heading as="h1" size={headingSize} color="primary.800">
                  Hesap Oluştur
                </Heading>
                
                <Text color="primary.600" fontSize="sm">
                  Zaten hesabın var mı?{' '}
                  <ChakraLink 
                    as={Link} 
                    to="/" 
                    color="accent.600" 
                    fontWeight="semibold"
                    _hover={{ color: 'accent.500', textDecoration: 'underline' }}
                  >
                    Giriş yap
                  </ChakraLink>
                </Text>
              </VStack>

              {/* Error Alert */}
              {error && (
                <Alert status="error" borderRadius="md" fontSize="sm">
                  <AlertIcon boxSize={4} />
                  {error}
                </Alert>
              )}

              {/* Registration Form */}
              <Box w="full" bg="white" p={{ base: 6, md: 8, lg: 10 }} borderRadius="xl" shadow="md" border="1px" borderColor="neutral.200">
                <form onSubmit={handleSubmit}>
                  <VStack spacing={8}>
                    {/* Two Column Layout for Desktop */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 8, lg: 12 }} w="full">
                      {/* Left Column - Avatar Upload */}
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                            Profil Fotoğrafı 
                            <Badge ml={3} colorScheme="accent" variant="subtle" fontSize="xs" px={2} py={1}>
                              İsteğe bağlı
                            </Badge>
                          </FormLabel>
                      
                      <Box
                        border="2px"
                        borderStyle="dashed"
                        borderColor={dragActive ? "accent.500" : "neutral.300"}
                        borderRadius="xl"
                        p={8}
                        bg={dragActive ? "accent.50" : "neutral.25"}
                        cursor="pointer"
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        _hover={{ borderColor: "accent.400", bg: "accent.50", transform: "translateY(-2px)", shadow: "lg" }}
                        position="relative"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                      >
                        {avatarPreview ? (
                          <VStack spacing={2}>
                            <Box position="relative">
                              <Avatar
                                size="lg"
                                src={avatarPreview}
                                bg="accent.100"
                              />
                              <IconButton
                                icon={<CloseIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="solid"
                                position="absolute"
                                top="-8px"
                                right="-8px"
                                borderRadius="full"
                                boxSize="24px"
                                minW="24px"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeAvatar()
                                }}
                                aria-label="Remove avatar"
                                zIndex={10}
                              />
                            </Box>
                            <Text 
                              fontSize="sm" 
                              color="primary.600" 
                              textAlign="center"
                              cursor="pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                fileInputRef.current?.click()
                              }}
                              _hover={{ color: "accent.600" }}
                            >
                              Fotoğrafı değiştirmek için tıklayın
                            </Text>
                          </VStack>
                        ) : (
                          <VStack spacing={3}>
                            <Circle size="56px" bg="accent.100" border="2px" borderColor="accent.200">
                              <AddIcon boxSize={6} color="accent.500" />
                            </Circle>
                            <VStack spacing={1}>
                              <Text fontSize="sm" color="primary.600" textAlign="center">
                                Fotoğrafı sürükleyip bırakın veya{' '}
                                <Text as="span" color="accent.600" fontWeight="medium">
                                  seçin
                                </Text>
                              </Text>
                              <Text fontSize="xs" color="primary.500">
                                PNG, JPG, WebP - max 5MB
                              </Text>
                            </VStack>
                          </VStack>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileInputChange}
                          style={{ 
                            position: 'absolute', 
                            top: '-9999px',
                            left: '-9999px', 
                            width: '1px', 
                            height: '1px', 
                            opacity: 0
                          }}
                        />
                      </Box>
                        </FormControl>
                      </VStack>

                      {/* Right Column - Form Fields */}
                      <VStack spacing={6} align="stretch">
                        {/* Username Field */}
                        <FormControl isRequired>
                          <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                            Kullanıcı Adı
                          </FormLabel>
                          <InputGroup>
                            <Input
                              name="nickname"
                              value={formData.nickname}
                              onChange={handleInputChange}
                              placeholder="Kullanıcı adınız"
                              maxLength={20}
                              focusBorderColor="accent.500"
                              bg="neutral.25"
                              borderColor="neutral.300"
                              borderRadius="lg"
                              h={12}
                              fontSize="md"
                              _hover={{ bg: "white", borderColor: "accent.300" }}
                              _focus={{ bg: "white", borderColor: "accent.500", shadow: "0 0 0 3px rgba(159, 122, 234, 0.1)" }}
                            />
                          </InputGroup>
                        </FormControl>

                        {/* Email Field */}
                        <FormControl>
                          <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                            E-posta 
                            <Badge ml={3} colorScheme="accent" variant="subtle" fontSize="xs" px={2} py={1}>
                              İsteğe bağlı
                            </Badge>
                          </FormLabel>
                          <InputGroup>
                            <Input
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="ornek@email.com"
                              focusBorderColor="accent.500"
                              bg="neutral.25"
                              borderColor="neutral.300"
                              borderRadius="lg"
                              h={12}
                              fontSize="md"
                              _hover={{ bg: "white", borderColor: "accent.300" }}
                              _focus={{ bg: "white", borderColor: "accent.500", shadow: "0 0 0 3px rgba(159, 122, 234, 0.1)" }}
                            />
                          </InputGroup>
                        </FormControl>

                        {/* Password Field */}
                        <FormControl isRequired>
                          <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                            Şifre
                          </FormLabel>
                          <InputGroup>
                            <Input
                              name="password"
                              type={showPasswords ? 'text' : 'password'}
                              value={formData.password}
                              onChange={handleInputChange}
                              placeholder="Şifreniz"
                              focusBorderColor="accent.500"
                              bg="neutral.25"
                              borderColor="neutral.300"
                              borderRadius="lg"
                              h={12}
                              fontSize="md"
                              _hover={{ bg: "white", borderColor: "accent.300" }}
                              _focus={{ bg: "white", borderColor: "accent.500", shadow: "0 0 0 3px rgba(159, 122, 234, 0.1)" }}
                            />
                            <InputRightElement>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswords(!showPasswords)}
                                icon={showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                                aria-label={showPasswords ? 'Hide password' : 'Show password'}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        {/* Confirm Password Field */}
                        <FormControl isRequired>
                          <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                            Şifre Tekrarı
                          </FormLabel>
                          <InputGroup>
                            <Input
                              name="confirmPassword"
                              type={showPasswords ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Şifrenizi tekrar girin"
                              focusBorderColor="accent.500"
                              bg="neutral.25"
                              borderColor="neutral.300"
                              borderRadius="lg"
                              h={12}
                              fontSize="md"
                              _hover={{ bg: "white", borderColor: "accent.300" }}
                              _focus={{ bg: "white", borderColor: "accent.500", shadow: "0 0 0 3px rgba(159, 122, 234, 0.1)" }}
                            />
                            <InputRightElement>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswords(!showPasswords)}
                                icon={showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                                aria-label={showPasswords ? 'Hide password' : 'Show password'}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>
                      </VStack>
                    </SimpleGrid>

                    {/* Password Requirements - Full Width */}
                    <Box w="full" p={4} bg="accent.25" borderRadius="lg" border="1px" borderColor="accent.200">
                      <Text fontSize="sm" color="accent.700" mb={2} fontWeight="medium">
                        Şifre gereksinimleri:
                      </Text>
                      <Stack spacing={1}>
                        <Text fontSize="sm" color="primary.600">• En az 6 karakter</Text>
                        <Text fontSize="sm" color="primary.600">• En az 1 büyük harf, 1 küçük harf ve 1 rakam</Text>
                      </Stack>
                    </Box>

                    {/* Submit Button */}
                    <AnimatedButton
                      type="submit"
                      colorScheme="accent"
                      size="lg"
                      w="full"
                      h={14}
                      fontSize="lg"
                      fontWeight="semibold"
                      isLoading={isLoading}
                      loadingText="Hesap oluşturuluyor..."
                      _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      borderRadius="xl"
                    >
                      Hesap Oluştur
                    </AnimatedButton>
                  </VStack>
                </form>
              </Box>

              {/* Footer Info */}
              <Text fontSize="xs" color="primary.500" textAlign="center" maxW="300px">
                Hesap oluşturarak gizlilik politikamızı ve kullanım koşullarımızı kabul etmiş olursunuz.
              </Text>
            </VStack>
          </FadeIn>
        </Container>
      </Box>
    </PageTransition>
  )
}

export default RegisterPage