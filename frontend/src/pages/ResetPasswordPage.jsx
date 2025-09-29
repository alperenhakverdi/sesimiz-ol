import { useState } from 'react'
import {
  Container,
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Button,
  Icon,
  InputGroup,
  InputRightElement,
  Input,
  HStack,
  PinInput,
  PinInputField,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Divider,
  Link as ChakraLink,
  useColorModeValue
} from '@chakra-ui/react'
import { LockIcon, CheckCircleIcon, ViewIcon, ViewOffIcon, WarningIcon } from '@chakra-ui/icons'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageTransition from '../components/animations/PageTransition'
import FadeIn from '../components/animations/FadeIn'
import { authAPI } from '../services/api'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const token = searchParams.get('token') || ''

  const [step, setStep] = useState(token ? 'otp' : 'missing-token')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [resetSessionToken, setResetSessionToken] = useState('')
  const [resetSessionTtl, setResetSessionTtl] = useState(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleOtpSubmit = async (event) => {
    event.preventDefault()
    setOtpError('')

    if (otp.trim().length !== 6) {
      setOtpError('Lütfen e-postanıza gelen 6 haneli doğrulama kodunu girin.')
      return
    }

    setIsVerifying(true)
    try {
      const response = await authAPI.verifyOtp({ token, otp })
      if (!response?.success) {
        throw new Error(response?.error?.message || 'Doğrulama başarısız oldu')
      }

      const nextToken = response?.data?.resetToken
      if (!nextToken) {
        throw new Error('Şifre sıfırlama oturumu oluşturulamadı')
      }

      setResetSessionToken(nextToken)
      setResetSessionTtl(response?.data?.expiresInMinutes ?? null)
      setStep('password')
      toast({
        title: 'Kod doğrulandı',
        description: 'Şimdi yeni şifreni belirleyebilirsin.',
        status: 'success',
        duration: 4000,
        isClosable: true
      })
    } catch (error) {
      setOtpError(error.message || 'Doğrulama işlemi başarısız oldu.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError('')

    if (password !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor. Lütfen kontrol edin.')
      return
    }

    setIsResetting(true)
    try {
      const response = await authAPI.resetPassword({ resetToken: resetSessionToken, password })
      if (!response?.success) {
        throw new Error(response?.error?.message || 'Şifre güncellenemedi')
      }

      setStep('completed')
      toast({
        title: 'Şifre güncellendi',
        description: 'Giriş yaparak devam edebilirsin.',
        status: 'success',
        duration: 4000,
        isClosable: true
      })
    } catch (error) {
      setPasswordError(error.message || 'Şifre güncelleme başarısız oldu.')
    } finally {
      setIsResetting(false)
    }
  }

  const handleNavigateHome = () => {
    navigate('/')
  }

  const renderMissingToken = () => (
    <Alert status="warning" borderRadius="lg">
      <AlertIcon as={WarningIcon} />
      <AlertDescription display="flex" flexDirection="column" alignItems="flex-start">
        Gerekli token bulunamadı. Lütfen e-posta bağlantısını doğru kullanın veya şifre sıfırlama talebi oluşturun.
        <ChakraLink as={Link} to="/sifremi-unuttum" color="accent.600" mt={2}>
          Şifre sıfırlama talebi oluştur
        </ChakraLink>
      </AlertDescription>
    </Alert>
  )

  const renderOtpStep = () => (
    <VStack as="form" onSubmit={handleOtpSubmit} spacing={6}>
      <FormControl>
        <FormLabel>Doğrulama Kodu</FormLabel>
        <HStack>
          <PinInput value={otp} onChange={setOtp} size="lg" otp mask="●">
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
          </PinInput>
        </HStack>
      </FormControl>
      {otpError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{otpError}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" colorScheme="accent" size="lg" isLoading={isVerifying} loadingText="Doğrulanıyor">
        Devam Et
      </Button>
    </VStack>
  )

  const renderPasswordStep = () => (
    <Box as="form" onSubmit={handlePasswordSubmit}>
      <VStack spacing={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>
            Güçlü bir şifre en az 8 karakter uzunluğunda olmalı ve harf, rakam ve sembol içermelidir.
          </Text>
        </Alert>

        <FormControl isRequired>
          <FormLabel color="neutral.700">Yeni Şifre</FormLabel>
          <InputGroup size="lg">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Yeni şifren"
              focusBorderColor="accent.500"
              borderColor="neutral.300"
              _hover={{ borderColor: 'neutral.400' }}
            />
            <InputRightElement width="3rem">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <Icon as={showPassword ? ViewOffIcon : ViewIcon} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel color="neutral.700">Şifreyi Doğrula</FormLabel>
          <InputGroup size="lg">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Şifreni tekrar gir"
              focusBorderColor="accent.500"
              borderColor="neutral.300"
              _hover={{ borderColor: 'neutral.400' }}
            />
            <InputRightElement width="3rem">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                <Icon as={showConfirmPassword ? ViewOffIcon : ViewIcon} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>

        {passwordError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          colorScheme="accent"
          size="lg"
          isLoading={isResetting}
          loadingText="Şifre güncelleniyor"
        >
          Şifremi Güncelle
        </Button>
      </VStack>
    </Box>
  )

  const renderCompletedStep = () => (
    <VStack spacing={6} textAlign="center">
      <Icon as={CheckCircleIcon} boxSize={16} color="accent.500" />
      <Heading size="md" color="neutral.800">Şifren başarıyla güncellendi</Heading>
      <Text color="neutral.600">
        Güvenlik için tüm aktif oturumların sonlandırıldı. Dilersen şimdi giriş yapabilirsin.
      </Text>
      <Button colorScheme="accent" size="lg" onClick={handleNavigateHome}>
        Ana sayfaya dön
      </Button>
    </VStack>
  )

  return (
    <PageTransition>
      <Container maxW="lg" py={{ base: 12, md: 16 }}>
        <FadeIn>
          <Box
            bg={useColorModeValue('white','neutral.800')}
            borderRadius="xl"
            boxShadow="lg"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
          >
            <VStack spacing={6} align="stretch">
              <VStack spacing={3} textAlign="center">
                <Icon as={LockIcon} boxSize={10} color="accent.500" />
                <Heading size="lg" color="neutral.800">
                  Şifreyi sıfırla
                </Heading>
                <Text color="neutral.600">
                  Hesabını güvende tutmak için birkaç adımda yeni şifreni belirleyebilirsin.
                </Text>
              </VStack>

              {step === 'missing-token' && renderMissingToken()}
              {step === 'otp' && renderOtpStep()}
              {step === 'password' && renderPasswordStep()}
              {step === 'completed' && renderCompletedStep()}

              <Divider />

              <VStack spacing={2} textAlign="center">
                <Text color="neutral.600">Yardımcı bağlantılar</Text>
                <ChakraLink as={Link} to="/sifremi-unuttum" color="accent.500" fontWeight="medium">
                  Şifre sıfırlama talebini tekrar oluştur
                </ChakraLink>
              </VStack>
            </VStack>
          </Box>
        </FadeIn>
      </Container>
    </PageTransition>
  )
}

export default ResetPasswordPage