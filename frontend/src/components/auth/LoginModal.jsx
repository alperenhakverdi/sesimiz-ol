import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  HStack,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Icon,
  Divider,
  InputGroup,
  InputRightElement,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LockIcon, ChatIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const LoginModal = ({ isOpen, onClose }) => {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const { login } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!nickname.trim()) {
      setError('Kullanıcı adı veya email gereklidir')
      return
    }

    if (!password.trim()) {
      setError('Şifre gereklidir')
      return
    }

    setIsLoading(true)

    try {
      await login(nickname, password)
      
      toast({
        title: "Başarıyla giriş yapıldı",
        description: `Hoş geldin!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      
      // Reset form and close modal
      setNickname('')
      setPassword('')
      onClose()
      
    } catch (err) {
      // More user-friendly error messages
      const errorMessage = err.message || 'Giriş işlemi başarısız'
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || 
          errorMessage.includes('invalid') || errorMessage.includes('wrong')) {
        setError('Kullanıcı adı veya şifre hatalı. Lütfen tekrar deneyin.')
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNickname('')
    setPassword('')
    setError('')
    setShowPassword(false)
    setActiveTab(0)
    onClose()
  }

  const handleNicknameChange = (e) => {
    setNickname(e.target.value)
    if (error) setError('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (error) setError('')
  }

  const isFormValid = nickname.trim().length > 0 && password.trim().length > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4}>
        <ModalHeader>
          <VStack spacing={3} align="center" textAlign="center">
            <HStack spacing={2} color="accent.500">
              <Icon as={LockIcon} boxSize={5} />
              <Icon as={ChatIcon} boxSize={5} />
            </HStack>
            <VStack spacing={1}>
              <Text fontSize="xl" color="neutral.800">
                Giriş Yap
              </Text>
              <Text fontSize="sm" color="neutral.500" fontWeight="normal">
                Hesabına giriş yaparak hikayelerini paylaş
              </Text>
            </VStack>
          </VStack>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            <VStack spacing={6}>
              {error && (
                <Box 
                  bg="red.50" 
                  p={3} 
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="red.200"
                  w="full"
                >
                  <Text fontSize="sm" color="red.700" textAlign="center">
                    {error}
                  </Text>
                </Box>
              )}

              {/* Username/Email Input */}
              <FormControl isRequired>
                <FormLabel color="neutral.700" fontSize="sm" fontWeight="medium">
                  Kullanıcı Adı veya E-posta
                </FormLabel>
                <Input
                  value={nickname}
                  onChange={handleNicknameChange}
                  placeholder="Kullanıcı adınız veya e-posta adresiniz"
                  focusBorderColor="accent.500"
                  borderColor="neutral.300"
                  _hover={{ borderColor: "neutral.400" }}
                  size="lg"
                />
              </FormControl>

              {/* Password Input */}
              <FormControl isRequired>
                <FormLabel color="neutral.700" fontSize="sm" fontWeight="medium">
                  Şifre
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Şifreniz"
                    focusBorderColor="accent.500"
                    borderColor="neutral.300"
                    _hover={{ borderColor: "neutral.400" }}
                    pr="4.5rem"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    >
                      <Icon as={showPassword ? ViewOffIcon : ViewIcon} />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Divider />

              {/* Register Link */}
              <Box w="full" textAlign="center">
                <Text fontSize="sm" color="neutral.600">
                  Henüz hesabın yok mu?{' '}
                  <Link to="/kayit-ol" onClick={handleClose}>
                    <Text as="span" color="accent.500" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
                      Buradan kayıt ol
                    </Text>
                  </Link>
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3} w="full" justify="end">
              <Button 
                variant="ghost" 
                onClick={handleClose}
                isDisabled={isLoading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                colorScheme="accent"
                isLoading={isLoading}
                loadingText="Giriş yapılıyor..."
                isDisabled={!isFormValid}
              >
                Giriş Yap
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default LoginModal