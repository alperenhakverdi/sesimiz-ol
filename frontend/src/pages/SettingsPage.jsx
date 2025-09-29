import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Container,
  VStack,
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
  InputGroup,
  InputRightElement,
  Divider,
  Circle,
  Badge,
  Stack,
  HStack,
  RadioGroup,
  Radio,
  Switch,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Textarea,
  useColorModeValue
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ArrowBackIcon, ViewIcon, ViewOffIcon, AddIcon, CloseIcon } from '@chakra-ui/icons'
import Cropper from 'react-easy-crop'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/common/ProtectedRoute'
import ProgressiveLoader from '../components/animations/ProgressiveLoader'

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImage = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Avatar kırpma işlemi başarısız oldu'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      0.95
    )
  })
}

const computePasswordStrength = (value) => {
  if (!value) {
    return { score: 0, label: 'Çok zayıf', colorScheme: 'red' }
  }

  let score = 0
  if (value.length >= 16) score += 50
  else if (value.length >= 12) score += 35
  else if (value.length >= 8) score += 25
  else score += value.length * 2

  const checks = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]
  checks.forEach((regex) => {
    if (regex.test(value)) {
      score += 12
    }
  })

  score = Math.min(score, 100)

  if (score >= 85) {
    return { score, label: 'Çok güçlü', colorScheme: 'green' }
  }
  if (score >= 65) {
    return { score, label: 'Güçlü', colorScheme: 'teal' }
  }
  if (score >= 45) {
    return { score, label: 'Orta', colorScheme: 'orange' }
  }
  if (score >= 25) {
    return { score, label: 'Zayıf', colorScheme: 'orange' }
  }
  return { score, label: 'Çok zayıf', colorScheme: 'red' }
}

const SettingsPage = () => {
  const { user, updateProfile, updateSettings, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const originalAvatarFileRef = useRef(null)

  const previewUrlRef = useRef(null)

  const initialProfileValues = useMemo(() => ({
    nickname: user?.nickname || '',
    email: user?.email || '',
    bio: user?.bio || '',
  }), [user])

  const [profileForm, setProfileForm] = useState(initialProfileValues)
  const [profileFieldErrors, setProfileFieldErrors] = useState({})
  const [profileTouched, setProfileTouched] = useState({})
  const [profileError, setProfileError] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [pendingAvatar, setPendingAvatar] = useState(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const initialSettings = useMemo(() => ({
    profileVisibility: user?.settings?.profileVisibility || 'PUBLIC',
    commentPermission: user?.settings?.commentPermission || 'EVERYONE',
    searchVisibility: user?.settings?.searchVisibility ?? true,
    theme: user?.settings?.theme || 'SYSTEM',
    fontSize: user?.settings?.fontSize || 'MEDIUM',
    reducedMotion: user?.settings?.reducedMotion ?? false,
  }), [user?.settings])

  const [settingsDraft, setSettingsDraft] = useState(initialSettings)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Çok zayıf', colorScheme: 'red' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const surfaceBg = useColorModeValue('white', 'neutral.800')
  const subtleSurfaceBg = useColorModeValue('neutral.50', 'neutral.700')
  const mutedText = useColorModeValue('neutral.600', 'neutral.300')
  const surfaceBorderColor = useColorModeValue('neutral.200', 'neutral.600')
  const dashedBorderColor = useColorModeValue('neutral.300', 'neutral.500')
  const dropzoneBg = useColorModeValue('neutral.50', 'neutral.700')
  const dropzoneActiveBg = useColorModeValue('accent.50', 'accent.900')

  useEffect(() => {
    setProfileForm(initialProfileValues)
    setProfileFieldErrors({})
    setProfileTouched({})
  }, [initialProfileValues])

  useEffect(() => {
    setSettingsDraft(initialSettings)
  }, [initialSettings])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setPasswordStrength(computePasswordStrength(passwordData.newPassword))
  }, [passwordData.newPassword])

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null
    // Handle base64 data URLs directly
    if (avatarPath.startsWith('data:image/')) return avatarPath
    // Handle HTTP URLs directly  
    if (avatarPath.startsWith('http')) return avatarPath
    // Handle relative paths
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${avatarPath}`
  }

  const validateProfileField = (name, value) => {
    if (name === 'nickname') {
      const trimmed = value.trim()
      if (!trimmed) return 'Kullanıcı adı gereklidir'
      if (trimmed.length < 2 || trimmed.length > 20) return 'Kullanıcı adı 2-20 karakter arası olmalıdır'
      if (!/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/.test(trimmed)) {
        return 'Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir'
      }
    }

    if (name === 'email') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      const emailRegex = /^[\w-.]+@[\w-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(trimmed)) {
        return 'Geçerli bir email adresi giriniz'
      }
    }

    if (name === 'bio') {
      if (value && value.length > 280) {
        return 'Hakkında alanı 280 karakteri aşamaz'
      }
    }

    return ''
  }

  const validateProfileForm = () => {
    const fields = ['nickname', 'email', 'bio']
    const errors = {}

    fields.forEach((field) => {
      const error = validateProfileField(field, profileForm[field])
      if (error) {
        errors[field] = error
      }
    })

    return errors
  }

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
    setProfileTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateProfileField(name, value)
    setProfileFieldErrors((prev) => ({ ...prev, [name]: error }))
    if (profileError) setProfileError('')
  }

  const hasProfileChanges = useMemo(() => {
    if (!user) return false
    const nicknameChanged = profileForm.nickname.trim() !== (user.nickname || '')
    const emailChanged = profileForm.email.trim() !== (user.email || '')
    const bioChanged = (profileForm.bio || '').trim() !== (user.bio || '')
    return nicknameChanged || emailChanged || bioChanged || !!avatar
  }, [profileForm, user, avatar])

  const hasProfileErrors = useMemo(
    () => Object.values(profileFieldErrors).some((error) => !!error),
    [profileFieldErrors]
  )

  const handleSettingsChange = (key, value) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const hasSettingsChanges = useMemo(() => {
    return JSON.stringify(settingsDraft) !== JSON.stringify(initialSettings)
  }, [settingsDraft, initialSettings])

  const getPasswordValidationErrors = (data) => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    if (!data.currentPassword) {
      errors.currentPassword = 'Mevcut şifre gereklidir'
    }

    if (!data.newPassword) {
      errors.newPassword = 'Yeni şifre gereklidir'
    } else {
      if (data.newPassword.length < 8) {
        errors.newPassword = 'Yeni şifre en az 8 karakter olmalıdır'
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(data.newPassword)) {
        errors.newPassword = 'Yeni şifre küçük/büyük harf, rakam ve özel karakter içermeli'
      }
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = 'Yeni şifre tekrarını giriniz'
    } else if (data.newPassword && data.confirmPassword !== data.newPassword) {
      errors.confirmPassword = 'Yeni şifreler eşleşmiyor'
    }

    return errors
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
      const reader = new FileReader()
      reader.onloadend = () => {
        setPendingAvatar(reader.result)
        setIsCropperOpen(true)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
      }
      reader.readAsDataURL(file)
      originalAvatarFileRef.current = file
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
    setPendingAvatar(null)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setAvatarPreview(null)
    originalAvatarFileRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleApplyCrop = async () => {
    if (!pendingAvatar || !croppedAreaPixels) {
      setIsCropperOpen(false)
      return
    }

    try {
      const blob = await getCroppedImage(pendingAvatar, croppedAreaPixels)
      const baseName = originalAvatarFileRef.current?.name?.split('.')?.[0] || 'avatar'
      const croppedFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' })
      const previewUrl = URL.createObjectURL(blob)

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }

      previewUrlRef.current = previewUrl
      setAvatar(croppedFile)
      setAvatarPreview(previewUrl)
      setPendingAvatar(null)
      setIsCropperOpen(false)
    } catch (error) {
      setProfileError(error.message || 'Profil fotoğrafı kırpılırken bir sorun oluştu')
    }
  }

  const handleCancelCrop = () => {
    setPendingAvatar(null)
    setIsCropperOpen(false)
    originalAvatarFileRef.current = null
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    const nextData = {
      ...passwordData,
      [name]: value,
    }
    setPasswordData(nextData)
    setPasswordFieldErrors(getPasswordValidationErrors(nextData))
    if (passwordError) setPasswordError('')
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()

    try {
      const errors = validateProfileForm()
      setProfileFieldErrors(errors)

      if (Object.keys(errors).length > 0) {
        setProfileError('Lütfen hatalı alanları düzeltin.')
        return
      }

      if (!hasProfileChanges) {
        toast({
          title: 'Değişiklik bulunamadı',
          description: 'Profiliniz zaten güncel görünüyor.',
          status: 'info',
          duration: 2500,
          isClosable: true,
        })
        return
      }

      setIsProfileLoading(true)

      const payload = {}
      const trimmedNickname = profileForm.nickname.trim()
      const trimmedEmail = profileForm.email.trim()
      const trimmedBio = profileForm.bio.trim()

      if (trimmedNickname && trimmedNickname !== (user?.nickname || '')) {
        payload.nickname = trimmedNickname
      }
      if (trimmedEmail !== (user?.email || '')) {
        payload.email = trimmedEmail
      }
      if (trimmedBio !== (user?.bio || '')) {
        payload.bio = trimmedBio
      }
      if (avatar) {
        payload.avatar = avatar
      }

      await updateProfile(payload)

      toast({
        title: 'Profil güncellendi',
        description: 'Profil bilgilerin başarıyla güncellendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setProfileError('')
      setAvatar(null)
      setPendingAvatar(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || 'Profil güncellenirken bir hata oluştu'
      setProfileError(message)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleSettingsSubmit = async () => {
    if (!hasSettingsChanges) {
      toast({
        title: 'Kaydedilecek değişiklik yok',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })
      return
    }

    try {
      setSettingsSaving(true)
      await updateSettings(settingsDraft)
      toast({
        title: 'Ayarlar kaydedildi',
        description: 'Tercihleriniz başarıyla güncellendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Ayarlar kaydedilemedi',
        description: error.response?.data?.error?.message || error.message || 'Tercihler güncellenirken bir sorun oluştu.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setSettingsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    try {
      const fieldErrors = getPasswordValidationErrors(passwordData)
      setPasswordFieldErrors(fieldErrors)

      const hasErrors = Object.values(fieldErrors).some((message) => message)
      if (hasErrors) {
        setPasswordError('Lütfen şifre alanlarını kontrol edin.')
        return
      }

      if (passwordData.newPassword === passwordData.currentPassword) {
        setPasswordError('Yeni şifre mevcut şifrenizle aynı olamaz')
        return
      }

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
      setPasswordFieldErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordError('')
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || 'Şifre güncellenirken bir hata oluştu'
      setPasswordError(message)
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
      <Modal isOpen={isCropperOpen} onClose={handleCancelCrop} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Profil fotoğrafını kırp</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {pendingAvatar ? (
              <Box position="relative" width="100%" height={{ base: '280px', md: '360px' }}>
                <Cropper
                  image={pendingAvatar}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </Box>
            ) : (
              <Box py={10} textAlign="center">
                <Text fontSize="sm" color={mutedText}>Görüntü yükleniyor...</Text>
              </Box>
            )}

            <Box mt={6}>
              <Text fontSize="sm" mb={2} color="primary.700">
                Yakınlaştır
              </Text>
              <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} isDisabled={!pendingAvatar}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancelCrop}>
              Vazgeç
            </Button>
            <Button colorScheme="accent" onClick={handleApplyCrop} isDisabled={!pendingAvatar}>
              Uygula
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
              <Text color={mutedText} maxW="lg">
                Profil bilgilerini düzenle ve hesap güvenliğini yönet
              </Text>
            </VStack>
          </ProgressiveLoader>

          {/* Settings Tabs */}
          <ProgressiveLoader delay={600}>
            <Box bg={surfaceBg} borderRadius="lg" shadow="sm" borderWidth="1px" borderColor={surfaceBorderColor}>
              <Tabs variant="enclosed" colorScheme="accent">
                <ProgressiveLoader delay={800}>
                  <TabList>
                    <Tab>Profil</Tab>
                    <Tab>Gizlilik</Tab>
                    <Tab>Güvenlik</Tab>
                    <Tab>Görünüm</Tab>
                  </TabList>
                </ProgressiveLoader>

                <TabPanels>
                  {/* Profil Tab */}
                  <TabPanel p={8}>
                    <ProgressiveLoader delay={1000}>
                      <form onSubmit={handleProfileSubmit}>
                        <VStack spacing={8} align="stretch">
                          {profileError && (
                            <Alert status="error" borderRadius="md">
                              <AlertIcon />
                              <Text fontSize="sm">{profileError}</Text>
                            </Alert>
                          )}

                          <Stack direction={{ base: 'column', md: 'row' }} spacing={6} align="stretch">
                            <VStack
                              spacing={4}
                              flex="0 0 240px"
                              bg={subtleSurfaceBg}
                              borderRadius="lg"
                              border="1px"
                              borderColor={surfaceBorderColor}
                              p={6}
                              align="center"
                            >
                              <Text fontSize="sm" fontWeight="medium" color="primary.700">
                                Mevcut Fotoğraf
                              </Text>
                              <Avatar
                                size="xl"
                                name={user?.nickname}
                                src={avatarPreview || getAvatarUrl(user?.avatar)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={removeAvatar}
                                isDisabled={!user?.avatar && !avatarPreview}
                              >
                                Fotoğrafı Kaldır
                              </Button>
                            </VStack>

                            <Box
                              flex="1"
                              border="2px"
                              borderStyle="dashed"
                              borderColor={dragActive ? 'accent.500' : dashedBorderColor}
                              borderRadius="xl"
                              p={6}
                              bg={dragActive ? dropzoneActiveBg : dropzoneBg}
                              cursor="pointer"
                              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                              _hover={{ borderColor: 'accent.400', bg: dropzoneActiveBg, transform: 'translateY(-2px)', shadow: 'lg' }}
                              position="relative"
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {avatarPreview ? (
                                <VStack spacing={3}>
                                  <Avatar size="lg" src={avatarPreview} bg="accent.100" />
                                  <HStack spacing={4} justify="center">
                                    <Button size="sm" variant="link" colorScheme="accent" onClick={() => fileInputRef.current?.click()}>
                                      Yeni fotoğraf seç
                                    </Button>
                                    <Button size="sm" variant="link" colorScheme="red" onClick={(event) => { event.stopPropagation(); removeAvatar() }}>
                                      Temizle
                                    </Button>
                                  </HStack>
                                  <Text fontSize="xs" color="primary.500">
                                    Fotoğrafı yeniden kırpmak için yeni bir dosya seçin.
                                  </Text>
                                </VStack>
                              ) : (
                                <VStack spacing={3}>
                                  <Circle size="56px" bg="accent.100" border="2px" borderColor="accent.200">
                                    <AddIcon boxSize={6} color="accent.500" />
                                  </Circle>
                                  <Text fontSize="sm" color="primary.600" textAlign="center">
                                    Fotoğrafı sürükleyip bırakın veya{' '}
                                    <Text as="span" color="accent.600" fontWeight="medium">
                                      bir dosya seçin
                                    </Text>
                                  </Text>
                                  <Text fontSize="xs" color="primary.500">
                                    JPG, PNG veya WebP formatı - maksimum 5MB
                                  </Text>
                                </VStack>
                              )}

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileInputChange}
                                style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                              />
                            </Box>
                          </Stack>

                          <FormControl isRequired isInvalid={profileTouched.nickname && !!profileFieldErrors.nickname}>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <Input
                              name="nickname"
                              value={profileForm.nickname}
                              onChange={handleProfileInputChange}
                              placeholder="Kullanıcı adınız"
                              maxLength={20}
                            />
                            {profileTouched.nickname && profileFieldErrors.nickname ? (
                              <FormErrorMessage>{profileFieldErrors.nickname}</FormErrorMessage>
                            ) : (
                              <FormHelperText>Kullanıcı adınız toplulukta görünen kimliğinizdir.</FormHelperText>
                            )}
                          </FormControl>

                          <FormControl isInvalid={profileTouched.email && !!profileFieldErrors.email}>
                            <FormLabel>E-posta Adresi</FormLabel>
                            <Input
                              name="email"
                              type="email"
                              value={profileForm.email}
                              onChange={handleProfileInputChange}
                              placeholder="ornek@mail.com"
                            />
                            {profileTouched.email && profileFieldErrors.email ? (
                              <FormErrorMessage>{profileFieldErrors.email}</FormErrorMessage>
                            ) : (
                              <FormHelperText>E-posta adresini güncel tutmak bildirimleri kaçırmamanı sağlar.</FormHelperText>
                            )}
                          </FormControl>

                          <FormControl isInvalid={profileTouched.bio && !!profileFieldErrors.bio}>
                            <FormLabel>Hakkında</FormLabel>
                            <Textarea
                              name="bio"
                              value={profileForm.bio}
                              onChange={handleProfileInputChange}
                              placeholder="Toplulukla paylaşmak istediğin kısa bir tanıtım yazısı..."
                              rows={4}
                              maxLength={280}
                            />
                            {profileTouched.bio && profileFieldErrors.bio ? (
                              <FormErrorMessage>{profileFieldErrors.bio}</FormErrorMessage>
                            ) : (
                              <FormHelperText display="flex" justifyContent="space-between" alignItems="center">
                                <Text color="neutral.500">Profilinde paylaşacağın metin herkese görünür.</Text>
                                <Text color={profileForm.bio.length > 240 ? 'orange.500' : 'neutral.500'}>
                                  {profileForm.bio.length}/280
                                </Text>
                              </FormHelperText>
                            )}
                          </FormControl>

                          <HStack justify="flex-end">
                            <Button
                              type="submit"
                              colorScheme="accent"
                              size="lg"
                              loadingText="Kaydediliyor..."
                              isLoading={isProfileLoading}
                              isDisabled={!hasProfileChanges || hasProfileErrors || isProfileLoading}
                            >
                              Profil Değişikliklerini Kaydet
                            </Button>
                          </HStack>

                          <Divider borderColor={surfaceBorderColor} />

                          <Box
                            bg={subtleSurfaceBg}
                            p={6}
                            borderRadius="xl"
                            border="1px"
                            borderColor={surfaceBorderColor}
                            shadow="sm"
                          >
                            <Text
                              fontSize="lg"
                              fontWeight="medium"
                              color="primary.800"
                              mb={5}
                            >
                              Profil & Hesap Bilgileri
                            </Text>

                            <VStack align="start" spacing={4}>
                              <Box>
                                <Text fontSize="sm" fontWeight="medium" color={mutedText} mb={1}>
                                  Kullanıcı Adı
                                </Text>
                                <Text fontSize="md" color="primary.800">
                                  @{user?.nickname}
                                </Text>
                              </Box>

                              <Box>
                                <Text fontSize="sm" fontWeight="medium" color={mutedText} mb={1}>
                                  E-posta Adresi
                                </Text>
                                <Text fontSize="md" color="primary.700">
                                  {user?.email || 'Belirtilmemiş'}
                                </Text>
                              </Box>

                              <Box>
                                <Text fontSize="sm" fontWeight="medium" color={mutedText} mb={1}>
                                  Üyelik Tarihi
                                </Text>
                                <Text fontSize="md" color="primary.700">
                                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                </Text>
                              </Box>
                            </VStack>

                            <Text fontSize="xs" color="primary.500" fontStyle="italic">
                              Kullanıcı adı dışındaki alanlarda destek ekibimizden yardım isteyebilirsin.
                            </Text>
                          </Box>
                        </VStack>
                      </form>
                    </ProgressiveLoader>
                  </TabPanel>

                  {/* Gizlilik Tab */}
                  <TabPanel p={8}>
                    <ProgressiveLoader delay={1000}>
                      <VStack spacing={8} align="stretch">
                        <Box
                          bg={subtleSurfaceBg}
                          p={6}
                          borderRadius="xl"
                          border="1px"
                          borderColor={surfaceBorderColor}
                          shadow="sm"
                        >
                          <Stack spacing={6}>
                            <FormControl>
                              <FormLabel fontWeight="semibold" color="primary.800">
                                Profil görünürlüğü
                              </FormLabel>
                              <RadioGroup
                                value={settingsDraft.profileVisibility}
                                onChange={(value) => handleSettingsChange('profileVisibility', value)}
                              >
                                <VStack align="stretch" spacing={2}>
                                  <Radio value="PUBLIC">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Herkese açık</Text>
                                      <Text fontSize="sm" color={mutedText}>Profilin tüm ziyaretçilere görünür.</Text>
                                    </Stack>
                                  </Radio>
                                  <Radio value="COMMUNITY">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Sadece topluluğa açık</Text>
                                      <Text fontSize="sm" color={mutedText}>Sadece giriş yapan kullanıcılar profilini görebilir.</Text>
                                    </Stack>
                                  </Radio>
                                  <Radio value="PRIVATE">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Gizli</Text>
                                      <Text fontSize="sm" color={mutedText}>Profilin sadece senin tarafından görüntülenir.</Text>
                                    </Stack>
                                  </Radio>
                                </VStack>
                              </RadioGroup>
                            </FormControl>

                            <Divider borderColor={surfaceBorderColor} />

                            <FormControl>
                              <FormLabel fontWeight="semibold" color="primary.800">
                                Yorum izinleri
                              </FormLabel>
                              <RadioGroup
                                value={settingsDraft.commentPermission}
                                onChange={(value) => handleSettingsChange('commentPermission', value)}
                              >
                                <VStack align="stretch" spacing={2}>
                                  <Radio value="EVERYONE">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Herkes yorum yapabilir</Text>
                                      <Text fontSize="sm" color={mutedText}>Topluluk üyeleri hikayelerine yorum bırakabilir.</Text>
                                    </Stack>
                                  </Radio>
                                  <Radio value="FOLLOWERS">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Sadece takip ettiklerim</Text>
                                      <Text fontSize="sm" color={mutedText}>Güvendiğin kişilerin yorum yapmasına izin ver.</Text>
                                    </Stack>
                                  </Radio>
                                  <Radio value="NONE">
                                    <Stack spacing={0} align="flex-start">
                                      <Text fontWeight="medium">Yorumlara kapalı</Text>
                                      <Text fontSize="sm" color={mutedText}>Hikayelerin yorumlara kapatılır.</Text>
                                    </Stack>
                                  </Radio>
                                </VStack>
                              </RadioGroup>
                            </FormControl>

                            <Divider borderColor={surfaceBorderColor} />

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="semibold" color="primary.800">
                                  Arama görünürlüğü
                                </FormLabel>
                                <Text fontSize="sm" color={mutedText}>
                                  Profilinin dahili aramalarda görünmesini yönet.
                                </Text>
                              </Box>
                              <Switch
                                colorScheme="accent"
                                isChecked={settingsDraft.searchVisibility}
                                onChange={(event) => handleSettingsChange('searchVisibility', event.target.checked)}
                              />
                            </FormControl>
                          </Stack>
                        </Box>

                        <HStack justify="flex-end">
                          <Button
                            onClick={handleSettingsSubmit}
                            colorScheme="accent"
                            size="lg"
                            loadingText="Kaydediliyor..."
                            isLoading={settingsSaving}
                            isDisabled={!hasSettingsChanges || settingsSaving}
                          >
                            Gizlilik Ayarlarını Kaydet
                          </Button>
                        </HStack>
                      </VStack>
                    </ProgressiveLoader>
                  </TabPanel>

                  {/* Güvenlik Tab */}
                  <TabPanel p={8}>
                    <ProgressiveLoader delay={1000}>
                      <VStack spacing={8} align="stretch">
                        <form onSubmit={handlePasswordSubmit}>
                          <VStack spacing={6} align="stretch">
                            {passwordError && (
                              <Alert status="error" borderRadius="md">
                                <AlertIcon />
                                <Text fontSize="sm">{passwordError}</Text>
                              </Alert>
                            )}

                            <FormControl isRequired isInvalid={!!passwordFieldErrors.currentPassword}>
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
                              {passwordFieldErrors.currentPassword ? (
                                <FormErrorMessage>{passwordFieldErrors.currentPassword}</FormErrorMessage>
                              ) : (
                                <FormHelperText>Hesap güvenliğini doğrulamak için mevcut şifreni gir.</FormHelperText>
                              )}
                            </FormControl>

                            <FormControl isRequired isInvalid={!!passwordFieldErrors.newPassword}>
                              <FormLabel>Yeni Şifre</FormLabel>
                              <VStack spacing={3} align="stretch">
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
                                <HStack spacing={3} align="center">
                                  <Progress
                                    flex="1"
                                    value={passwordStrength.score}
                                    size="sm"
                                    borderRadius="md"
                                    colorScheme={passwordStrength.colorScheme}
                                  />
                                  <Badge colorScheme={passwordStrength.colorScheme}>{passwordStrength.label}</Badge>
                                </HStack>
                              </VStack>
                              {passwordFieldErrors.newPassword ? (
                                <FormErrorMessage>{passwordFieldErrors.newPassword}</FormErrorMessage>
                              ) : (
                                <FormHelperText>
                                  En az 8 karakter, küçük/büyük harf, rakam ve özel karakter içermelidir.
                                </FormHelperText>
                              )}
                            </FormControl>

                            <FormControl isRequired isInvalid={!!passwordFieldErrors.confirmPassword}>
                              <FormLabel>Yeni Şifre Tekrarı</FormLabel>
                              <InputGroup size="lg">
                                <Input
                                  name="confirmPassword"
                                  type={showPasswords ? 'text' : 'password'}
                                  value={passwordData.confirmPassword}
                                  onChange={handlePasswordInputChange}
                                  placeholder="Yeni şifreyi tekrar girin"
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
                              {passwordFieldErrors.confirmPassword ? (
                                <FormErrorMessage>{passwordFieldErrors.confirmPassword}</FormErrorMessage>
                              ) : (
                                <FormHelperText>Yeni şifren ile aynı olduğundan emin ol.</FormHelperText>
                              )}
                            </FormControl>

                            <Button
                              type="submit"
                              colorScheme="accent"
                              size="lg"
                              loadingText="Değiştiriliyor..."
                              isLoading={isPasswordLoading}
                              isDisabled={
                                isPasswordLoading ||
                                Object.values(passwordFieldErrors).some((error) => !!error) ||
                                !passwordData.currentPassword ||
                                !passwordData.newPassword ||
                                !passwordData.confirmPassword
                              }
                            >
                              Şifreyi Değiştir
                            </Button>
                          </VStack>
                        </form>

                        <Divider borderColor={surfaceBorderColor} />

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
                              bg: 'red.50',
                              transform: 'translateY(-1px)',
                              shadow: 'md',
                            }}
                            _active={{
                              transform: 'translateY(0px)',
                            }}
                            transition="all 0.2s ease"
                          >
                            Çıkış Yap
                          </Button>
                        </Box>
                      </VStack>
                    </ProgressiveLoader>
                  </TabPanel>

                  {/* Görünüm Tab */}
                  <TabPanel p={8}>
                    <ProgressiveLoader delay={1000}>
                      <VStack spacing={8} align="stretch">
                        <Box
                          bg={subtleSurfaceBg}
                          p={6}
                          borderRadius="xl"
                          border="1px"
                          borderColor={surfaceBorderColor}
                          shadow="sm"
                        >
                          <Stack spacing={6}>
                            <FormControl>
                              <FormLabel fontWeight="semibold" color="primary.800">
                                Tema tercihi
                              </FormLabel>
                              <RadioGroup
                                value={settingsDraft.theme}
                                onChange={(value) => handleSettingsChange('theme', value)}
                              >
                                <HStack spacing={4} wrap="wrap">
                                  <Radio value="SYSTEM">Sistem Varsayılanı</Radio>
                                  <Radio value="LIGHT">Açık Tema</Radio>
                                  <Radio value="DARK">Koyu Tema</Radio>
                                </HStack>
                              </RadioGroup>
                            </FormControl>

                            <Divider borderColor={surfaceBorderColor} />

                            <FormControl>
                              <FormLabel fontWeight="semibold" color="primary.800">
                                Yazı boyutu
                              </FormLabel>
                              <RadioGroup
                                value={settingsDraft.fontSize}
                                onChange={(value) => handleSettingsChange('fontSize', value)}
                              >
                                <HStack spacing={4} wrap="wrap">
                                  <Radio value="SMALL">Kompakt</Radio>
                                  <Radio value="MEDIUM">Standart</Radio>
                                  <Radio value="LARGE">Büyük</Radio>
                                </HStack>
                              </RadioGroup>
                            </FormControl>

                            <Divider borderColor={surfaceBorderColor} />

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="semibold" color="primary.800">
                                  Animasyonları azalt
                                </FormLabel>
                                <Text fontSize="sm" color={mutedText}>
                                  Hareket hassasiyetin varsa animasyonları kıs.
                                </Text>
                              </Box>
                              <Switch
                                colorScheme="accent"
                                isChecked={settingsDraft.reducedMotion}
                                onChange={(event) => handleSettingsChange('reducedMotion', event.target.checked)}
                              />
                            </FormControl>
                          </Stack>
                        </Box>

                        <Box
                          border="1px"
                          borderColor={settingsDraft.theme === 'DARK' ? 'gray.700' : 'neutral.200'}
                          borderRadius="xl"
                          p={6}
                          bg={settingsDraft.theme === 'DARK' ? 'gray.900' : 'white'}
                          color={settingsDraft.theme === 'DARK' ? 'gray.100' : 'neutral.800'}
                          shadow="sm"
                        >
                          <Text fontSize="sm" textTransform="uppercase" fontWeight="medium" color={settingsDraft.theme === 'DARK' ? 'gray.400' : 'neutral.500'}>
                            Önizleme
                          </Text>
                          <Heading size="md" mt={2} mb={3}>
                            Sesimiz Ol
                          </Heading>
                          <Text fontSize={settingsDraft.fontSize === 'SMALL' ? 'sm' : settingsDraft.fontSize === 'LARGE' ? 'lg' : 'md'} lineHeight="tall">
                            Hikâyeni paylaşırken görünüm tercihlerin anında uygulanır. Daha okunabilir bir deneyim için yazı boyutunu ve temayı dilediğin gibi ayarlayabilirsin.
                          </Text>
                        </Box>

                        <HStack justify="flex-end">
                          <Button
                            onClick={handleSettingsSubmit}
                            colorScheme="accent"
                            size="lg"
                            loadingText="Kaydediliyor..."
                            isLoading={settingsSaving}
                            isDisabled={!hasSettingsChanges || settingsSaving}
                          >
                            Görünüm Tercihlerini Kaydet
                          </Button>
                        </HStack>
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
