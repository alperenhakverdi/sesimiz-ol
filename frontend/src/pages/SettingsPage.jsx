import { useState, useRef } from 'react'
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
  FormHelperText,
  FormErrorMessage,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Image,
  InputGroup,
  InputRightElement,
  Divider,
  Circle,
  IconButton,
  Badge,
  SimpleGrid
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ArrowBackIcon, ViewIcon, ViewOffIcon, EditIcon, AddIcon, CloseIcon } from '@chakra-ui/icons'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/common/ProtectedRoute'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const SettingsPage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)

  // Profile form state - read-only display only
  // const [profileData, setProfileData] = useState({
  //   nickname: user?.nickname || '',
  //   email: user?.email || ''
  // })
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    if (avatarPath.startsWith('http')) return avatarPath
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${avatarPath}`
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

  const handleFileSelect = (file) => {
    try {
      validateFile(file)
      setAvatar(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setProfileError('')
    } catch (error) {
      setProfileError(error.message)
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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    if (passwordError) setPasswordError('')
  }

  const validateProfileForm = () => {
    // Avatar-only validation - profile data is read-only
    return true
  }

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      throw new Error('Mevcut şifre gereklidir')
    }
    
    if (!passwordData.newPassword) {
      throw new Error('Yeni şifre gereklidir')
    }
    
    if (passwordData.newPassword.length < 6) {
      throw new Error('Yeni şifre en az 6 karakter olmalıdır')
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      throw new Error('Yeni şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error('Yeni şifreler eşleşmiyor')
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      validateProfileForm()
      
      setIsProfileLoading(true)
      
      const updateData = {
        avatar: avatar
      }
      
      await updateProfile(updateData)
      
      toast({
        title: 'Profil güncellendi',
        description: 'Profil bilgilerin başarıyla güncellendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Reset avatar states
      setAvatar(null)
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    try {
      validatePasswordForm()
      
      setIsPasswordLoading(true)
      
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      toast({
        title: 'Şifre değiştirildi',
        description: 'Şifren başarıyla değiştirildi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast({
      title: 'Çıkış yapıldı',
      description: 'Hesabınızdan çıkış yapıldı.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <ProtectedRoute>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Back Button */}
          <ProgressiveLoader delay={200}>
            <Box>
              <Button 
                leftIcon={<ArrowBackIcon />} 
                variant="ghost" 
                colorScheme="accent"
                as={RouterLink}
                to="/"
                size="sm"
              >
                Ana Sayfaya Dön
              </Button>
            </Box>
          </ProgressiveLoader>

          {/* Page Header */}
          <ProgressiveLoader delay={400}>
            <VStack spacing={4} textAlign="center">
              <Heading as="h1" size="xl" color="accent.500">
                Hesap Ayarları
              </Heading>
              <Text color="neutral.600" maxW="lg">
                Profil bilgilerini düzenle ve hesap güvenliğini yönet
              </Text>
            </VStack>
          </ProgressiveLoader>

          {/* Settings Tabs */}
          <ProgressiveLoader delay={600}>
            <Box bg="white" borderRadius="lg" shadow="sm">
            <Tabs variant="enclosed" colorScheme="accent">
              <ProgressiveLoader delay={800}>
                <TabList>
                  <Tab>Profil Bilgileri</Tab>
                  <Tab>Şifre Değiştir</Tab>
                  <Tab>Hesap</Tab>
                </TabList>
              </ProgressiveLoader>

              <TabPanels>
                {/* Profile Tab */}
                <TabPanel p={8}>
                  <ProgressiveLoader delay={1000}>
                    <form onSubmit={handleProfileSubmit}>
                      <VStack spacing={6} align="stretch">
                        {profileError && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">{profileError}</Text>
                          </Alert>
                        )}

                      {/* Current Avatar Display */}
                      <Box textAlign="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={3}>
                          Mevcut Profil Fotoğrafı
                        </Text>
                        {user?.avatar ? (
                          <Image
                            src={getAvatarUrl(user.avatar)}
                            alt="Mevcut profil fotoğrafı"
                            boxSize="80px"
                            borderRadius="full"
                            objectFit="cover"
                            mx="auto"
                            fallback={<Avatar size="xl" name={user.nickname} />}
                          />
                        ) : (
                          <Avatar size="xl" name={user?.nickname} mx="auto" />
                        )}
                      </Box>

                      {/* Avatar Upload */}
                      <FormControl>
                        <FormLabel fontSize="md" color="primary.700" fontWeight="medium">
                          Yeni Profil Fotoğrafı 
                          <Badge ml={3} colorScheme="accent" variant="subtle" fontSize="xs" px={2} py={1}>
                            İsteğe bağlı
                          </Badge>
                        </FormLabel>
                        
                        <Box
                          border="2px"
                          borderStyle="dashed"
                          borderColor={dragActive ? "accent.500" : "neutral.300"}
                          borderRadius="xl"
                          p={6}
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

                      {/* Profile Info Display */}
                      <Box bg="neutral.50" p={6} borderRadius="lg" border="1px" borderColor="neutral.200">
                        <VStack spacing={4} align="start">
                          <Text fontSize="md" fontWeight="medium" color="primary.700">
                            Profil Bilgileri
                          </Text>
                          
                          <VStack spacing={3} align="start" w="full">
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="primary.600" mb={1}>
                                Kullanıcı Adı
                              </Text>
                              <Text fontSize="lg" color="primary.800" fontWeight="semibold">
                                @{user?.nickname}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="primary.600" mb={1}>
                                E-posta
                              </Text>
                              <Text fontSize="md" color="primary.700">
                                {user?.email || 'Belirtilmemiş'}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="primary.600" mb={1}>
                                Hesap Oluşturma
                              </Text>
                              <Text fontSize="md" color="primary.700">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                              </Text>
                            </Box>
                          </VStack>
                          
                          <Text fontSize="xs" color="primary.500" fontStyle="italic">
                            Profil bilgilerinizi değiştirmek için destek ekibimizle iletişime geçin.
                          </Text>
                        </VStack>
                      </Box>

                      {/* Submit Button */}
                        {(avatar || avatarPreview) && (
                          <Button 
                            type="submit" 
                            colorScheme="accent" 
                            size="lg"
                            isLoading={isProfileLoading}
                            loadingText="Güncelleniyor..."
                          >
                            Profil Fotoğrafını Güncelle
                          </Button>
                        )}
                      </VStack>
                    </form>
                  </ProgressiveLoader>
                </TabPanel>

                {/* Password Tab */}
                <TabPanel p={8}>
                  <ProgressiveLoader delay={1000}>
                    <form onSubmit={handlePasswordSubmit}>
                      <VStack spacing={6} align="stretch">
                        {passwordError && (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">{passwordError}</Text>
                          </Alert>
                        )}

                      {/* Current Password */}
                      <FormControl isRequired>
                        <FormLabel>Mevcut Şifre</FormLabel>
                        <InputGroup size="lg">
                          <Input
                            name="currentPassword"
                            type={showPasswords ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Mevcut şifreniz"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowPasswords(!showPasswords)}
                              variant="ghost"
                            >
                              {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      {/* New Password */}
                      <FormControl isRequired>
                        <FormLabel>Yeni Şifre</FormLabel>
                        <InputGroup size="lg">
                          <Input
                            name="newPassword"
                            type={showPasswords ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Yeni şifreniz"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowPasswords(!showPasswords)}
                              variant="ghost"
                            >
                              {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                        <FormHelperText>
                          En az 6 karakter, 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir
                        </FormHelperText>
                      </FormControl>

                      {/* Confirm Password */}
                      <FormControl isRequired>
                        <FormLabel>Yeni Şifre Tekrarı</FormLabel>
                        <InputGroup size="lg">
                          <Input
                            name="confirmPassword"
                            type={showPasswords ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Yeni şifrenizi tekrar girin"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowPasswords(!showPasswords)}
                              variant="ghost"
                            >
                              {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                        {/* Submit Button */}
                        <Button 
                          type="submit" 
                          colorScheme="accent" 
                          size="lg"
                          isLoading={isPasswordLoading}
                          loadingText="Değiştiriliyor..."
                        >
                          Şifreyi Değiştir
                        </Button>
                      </VStack>
                    </form>
                  </ProgressiveLoader>
                </TabPanel>

                {/* Account Tab */}
                <TabPanel p={8}>
                  <ProgressiveLoader delay={1000}>
                    <VStack spacing={8} align="stretch">
                      {/* Account Information Card */}
                      <Box 
                        bg="neutral.50" 
                        p={6} 
                        borderRadius="xl" 
                        border="1px" 
                        borderColor="neutral.200"
                        shadow="sm"
                      >
                        <Text 
                          fontSize="lg" 
                          fontWeight="medium" 
                          color="primary.800" 
                          mb={5}
                        >
                          Hesap Bilgileri
                        </Text>
                        
                        <VStack align="start" spacing={4}>
                          <Box>
                            <Text 
                              fontSize="sm" 
                              fontWeight="medium" 
                              color="neutral.600" 
                              mb={1}
                            >
                              Kullanıcı Adı
                            </Text>
                            <Text 
                              fontSize="md" 
                              fontWeight="normal" 
                              color="primary.800"
                            >
                              @{user?.nickname}
                            </Text>
                          </Box>
                          
                          <Box>
                            <Text 
                              fontSize="sm" 
                              fontWeight="medium" 
                              color="neutral.600" 
                              mb={1}
                            >
                              E-posta Adresi
                            </Text>
                            <Text 
                              fontSize="md" 
                              fontWeight="normal" 
                              color="primary.700"
                            >
                              {user?.email || 'Belirtilmemiş'}
                            </Text>
                          </Box>
                          
                          <Box>
                            <Text 
                              fontSize="sm" 
                              fontWeight="medium" 
                              color="neutral.600" 
                              mb={1}
                            >
                              Üyelik Tarihi
                            </Text>
                            <Text 
                              fontSize="md" 
                              fontWeight="normal" 
                              color="primary.700"
                            >
                              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                            </Text>
                          </Box>
                        </VStack>
                      </Box>

                      <Divider borderColor="neutral.200" />

                      {/* Account Actions */}
                      <Box>
                        <Text 
                          fontSize="xl" 
                          fontWeight="semibold" 
                          color="primary.800" 
                          mb={4}
                          letterSpacing="-0.025em"
                        >
                          Hesap İşlemleri
                        </Text>
                        
                        <Button 
                          colorScheme="red" 
                          variant="outline"
                          onClick={handleLogout}
                          size="lg"
                          width="fit-content"
                          fontWeight="semibold"
                          letterSpacing="-0.025em"
                          borderWidth="2px"
                          _hover={{
                            bg: "red.50",
                            transform: "translateY(-1px)",
                            shadow: "md"
                          }}
                          _active={{
                            transform: "translateY(0px)"
                          }}
                          transition="all 0.2s ease"
                        >
                          Çıkış Yap
                        </Button>
                      </Box>
                    </VStack>
                  </ProgressiveLoader>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
          </ProgressiveLoader>
        </VStack>
      </Container>
    </ProtectedRoute>
  )
}

export default SettingsPage