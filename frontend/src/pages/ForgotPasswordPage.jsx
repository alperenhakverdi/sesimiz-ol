import { useState } from 'react'
import {
  Container,
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Link as ChakraLink,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import { EmailIcon, CheckCircleIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { Link, useNavigate } from 'react-router-dom'
import PageTransition from '../components/animations/PageTransition'
import FadeIn from '../components/animations/FadeIn'
import { authAPI } from '../services/api'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast({
        title: 'E-posta adresi gerekli',
        description: 'Şifre sıfırlama bağlantısı gönderebilmemiz için e-posta adresini girmeniz gerekiyor.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })
      return
    }
    setIsLoading(true)
    try {
      const result = await authAPI.forgotPassword(trimmedEmail)
      const resetToken = result?.data?.resetToken
      setSubmitted(true)
      toast({
        title: 'Talep alındı',
        description: 'Eğer kayıtlı bir hesabınız varsa şifre sıfırlama adımlarını e-postanıza gönderdik.',
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      if (resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`)
      }
    } catch (error) {
      toast({
        title: 'İşlem başarısız',
        description: error.message || 'Şifre sıfırlama isteği gönderilemedi. Lütfen daha sonra tekrar deneyin.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setSubmitted(false)
  }

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
                <Icon as={EmailIcon} boxSize={10} color="accent.500" />
                <Heading size="lg" color="neutral.800">
                  Şifreni mi unuttun?
                </Heading>
                <Text color="neutral.600">
                  E-posta adresini gir, şifre sıfırlama adımlarını sana gönderelim. Güvenliğin için bağlantı kısa süreliğine geçerli olacak.
                </Text>
              </VStack>

              {submitted && (
                <Alert status="success" borderRadius="lg">
                  <AlertIcon />
                  <AlertDescription display="flex" alignItems="center">
                    <Icon as={CheckCircleIcon} mr={2} />
                    Eğer hesabımızda kayıtlıysan, gelen kutunu veya spam klasörünü kontrol etmeyi unutma.
                  </AlertDescription>
                </Alert>
              )}

              <Box as="form" onSubmit={handleSubmit} noValidate>
                <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel color="neutral.700">E-posta Adresi</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="ornek@mail.com"
                      focusBorderColor="accent.500"
                      borderColor="neutral.300"
                      _hover={{ borderColor: 'neutral.400' }}
                      size="lg"
                      isDisabled={submitted}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="accent"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Gönderiliyor"
                    isDisabled={submitted}
                  >
                    Şifre Sıfırlama Bağlantısı Gönder
                  </Button>

                  {submitted && (
                    <Button
                      variant="outline"
                      size="lg"
                      leftIcon={<Icon as={ArrowBackIcon} />}
                      onClick={resetForm}
                    >
                      Yeni bir talep gönder
                    </Button>
                  )}
                </VStack>
              </Box>

              <Divider />

              <VStack spacing={2} textAlign="center">
                <Text color="neutral.600">
                  Yardıma mı ihtiyacın var?
                </Text>
                <ChakraLink as={Link} to="/" color="accent.500" fontWeight="medium">
                  Ana sayfaya dön
                </ChakraLink>
              </VStack>
            </VStack>
          </Box>
        </FadeIn>
      </Container>
    </PageTransition>
  )
}

export default ForgotPasswordPage