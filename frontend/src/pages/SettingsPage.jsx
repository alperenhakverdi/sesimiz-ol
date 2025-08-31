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
  Divider
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ArrowBackIcon, ViewIcon, ViewOffIcon, EditIcon } from '@chakra-ui/icons'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/common/ProtectedRoute'

const SettingsPage = () => {
  const { user, updateProfile, changePassword, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || ''
  })
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    if (avatarPath.startsWith('http')) return avatarPath
    return `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${avatarPath}`
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

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    if (profileError) setProfileError('')
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
    if (!profileData.nickname.trim()) {
      throw new Error('Kullanıcı adı gereklidir')
    }
    
    if (profileData.nickname.trim().length < 2) {
      throw new Error('Kullanıcı adı en az 2 karakter olmalıdır')
    }
    
    if (profileData.nickname.trim().length > 20) {
      throw new Error('Kullanıcı adı en fazla 20 karakter olmalıdır')
    }
    
    if (!/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/.test(profileData.nickname.trim())) {
      throw new Error('Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir')
    }
    
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      throw new Error('Geçerli bir email adresi giriniz')
    }
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
        nickname: profileData.nickname.trim(),
        email: profileData.email.trim() || undefined,
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
              Hesap Ayarları
            </Heading>
            <Text color="gray.600" maxW="lg">
              Profil bilgilerini düzenle ve hesap güvenliğini yönet
            </Text>
          </VStack>

          {/* Settings Tabs */}
          <Box bg="white" borderRadius="lg" shadow="sm">
            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab>Profil Bilgileri</Tab>
                <Tab>Şifre Değiştir</Tab>
                <Tab>Hesap</Tab>
              </TabList>

              <TabPanels>
                {/* Profile Tab */}
                <TabPanel p={8}>
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
                        <FormLabel>Yeni Profil Fotoğrafı</FormLabel>
                        
                        <div
                          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                            dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          {avatarPreview ? (
                            <div className="text-center">
                              <div className="relative inline-block">
                                <img
                                  src={avatarPreview}
                                  alt="Yeni profil fotoğrafı"
                                  className="h-20 w-20 rounded-full object-cover mx-auto"
                                />
                                <button
                                  type="button"
                                  onClick={removeAvatar}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">Fotoğrafı değiştirmek için tıklayın</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <EditIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <p className="text-sm text-gray-600">
                                  Fotoğrafı sürükleyip bırakın veya seçin
                                </p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP - max 5MB</p>
                              </div>
                            </div>
                          )}
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileInputChange}
                          />
                        </div>
                      </FormControl>

                      {/* Nickname Field */}
                      <FormControl isRequired>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <Input 
                          name="nickname"
                          value={profileData.nickname}
                          onChange={handleProfileInputChange}
                          placeholder="Kullanıcı adınız"
                          size="lg"
                          maxLength={20}
                        />
                        <FormHelperText>
                          2-20 karakter arası, harf, rakam, _, - kullanabilirsiniz
                        </FormHelperText>
                      </FormControl>

                      {/* Email Field */}
                      <FormControl>
                        <FormLabel>E-posta (İsteğe bağlı)</FormLabel>
                        <Input 
                          name="email"
                          type="email"
                          value={profileData.email}
                          onChange={handleProfileInputChange}
                          placeholder="ornek@email.com"
                          size="lg"
                        />
                        <FormHelperText>
                          E-posta adresinizi güncelleyebilirsiniz
                        </FormHelperText>
                      </FormControl>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        colorScheme="brand" 
                        size="lg"
                        isLoading={isProfileLoading}
                        loadingText="Güncelleniyor..."
                      >
                        Profili Güncelle
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Password Tab */}
                <TabPanel p={8}>
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
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Mevcut şifreniz"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              variant="ghost"
                            >
                              {showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
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
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Yeni şifreniz"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              variant="ghost"
                            >
                              {showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
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
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            placeholder="Yeni şifrenizi tekrar girin"
                            pr="4.5rem"
                          />
                          <InputRightElement width="4.5rem">
                            <Button
                              h="1.75rem"
                              size="sm"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              variant="ghost"
                            >
                              {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        colorScheme="brand" 
                        size="lg"
                        isLoading={isPasswordLoading}
                        loadingText="Değiştiriliyor..."
                      >
                        Şifreyi Değiştir
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Account Tab */}
                <TabPanel p={8}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Text fontSize="lg" fontWeight="medium" color="gray.800" mb={2}>
                        Hesap Bilgileri
                      </Text>
                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.600">
                          <Text as="span" fontWeight="medium">Kullanıcı Adı:</Text> @{user?.nickname}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          <Text as="span" fontWeight="medium">E-posta:</Text> {user?.email || 'Belirtilmemiş'}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          <Text as="span" fontWeight="medium">Hesap Oluşturulma:</Text> {
                            user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'
                          }
                        </Text>
                      </VStack>
                    </Box>

                    <Divider />

                    <Box>
                      <Text fontSize="lg" fontWeight="medium" color="gray.800" mb={4}>
                        Hesap İşlemleri
                      </Text>
                      
                      <VStack spacing={4} align="stretch">
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontWeight="bold" fontSize="sm">
                              Çıkış Yap
                            </Text>
                            <Text fontSize="sm">
                              Hesabınızdan güvenli bir şekilde çıkış yapın
                            </Text>
                          </VStack>
                        </Alert>
                        
                        <Button 
                          colorScheme="orange" 
                          variant="outline"
                          onClick={handleLogout}
                          size="lg"
                        >
                          Çıkış Yap
                        </Button>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>
    </ProtectedRoute>
  )
}

export default SettingsPage